-- Migration: Home Planner Complete Database Schema
-- Purpose: Creates all tables, indexes, functions, and RLS policies for the Home Planner application
-- Tables: families, users, family_members, children, events, event_participants, event_exceptions, external_calendars, invitations, logs
-- Special considerations: RLS enabled on all tables, helper functions for security checks, polymorphic relationships

-- ============================================================================
-- 1. CREATE ENUMS (for better data integrity and performance)
-- ============================================================================

-- Event types enum
create type event_type_enum as enum ('elastic', 'blocker');

-- Family member roles enum
create type family_role_enum as enum ('admin', 'member');

-- Invitation status enum
create type invitation_status_enum as enum ('pending', 'accepted', 'expired');

-- Actor type enum for logs
create type actor_type_enum as enum ('user', 'system');

-- ============================================================================
-- 2. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Helper function to check if a user is a member of a family
create or replace function is_family_member(p_family_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.family_members
    where family_id = p_family_id
      and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Helper function to check if a user is an admin of a family
create or replace function is_family_admin(p_family_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.family_members
    where family_id = p_family_id
      and user_id = auth.uid()
      and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 3. CREATE TABLES
-- ============================================================================

-- families table
-- Stores the central family units
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

comment on table public.families is 'Stores the central family units';
comment on column public.families.id is 'Unique identifier for the family';
comment on column public.families.name is 'The name of the family (e.g., "The Smiths")';
comment on column public.families.created_at is 'Timestamp of when the family was created';

-- users table
-- Stores public-facing user profile information, extending the auth.users table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

comment on table public.users is 'Stores public-facing user profile information';
comment on column public.users.id is 'Mirrors the id from Supabase auth.users table';
comment on column public.users.full_name is 'User''s full name';
comment on column public.users.avatar_url is 'URL for the user''s profile picture';
comment on column public.users.updated_at is 'Timestamp of the last profile update';

-- family_members table
-- A junction table linking users to families and defining their roles
create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role family_role_enum not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

comment on table public.family_members is 'A junction table linking users to families and defining their roles';
comment on column public.family_members.family_id is 'Identifier for the family';
comment on column public.family_members.user_id is 'Identifier for the user';
comment on column public.family_members.role is 'Role of the user in the family (admin or member)';
comment on column public.family_members.joined_at is 'Timestamp of when the user joined the family';

-- children table
-- Stores profiles for children, who do not have their own user accounts
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

comment on table public.children is 'Stores profiles for children, who do not have their own user accounts';
comment on column public.children.id is 'Unique identifier for the child';
comment on column public.children.family_id is 'The family the child belongs to';
comment on column public.children.name is 'The child''s name';
comment on column public.children.created_at is 'Timestamp of when the child profile was created';

-- events table
-- The core table for all scheduled events and tasks
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_all_day boolean not null default false,
  event_type event_type_enum not null default 'elastic',
  recurrence_pattern jsonb,
  is_synced boolean not null default false,
  external_calendar_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

comment on table public.events is 'The core table for all scheduled events and tasks';
comment on column public.events.id is 'Unique identifier for the event';
comment on column public.events.family_id is 'The family this event belongs to';
comment on column public.events.title is 'The title or name of the event';
comment on column public.events.start_time is 'The start time of the event (in UTC)';
comment on column public.events.end_time is 'The end time of the event (in UTC)';
comment on column public.events.is_all_day is 'Flag for events that last the entire day';
comment on column public.events.event_type is 'Type of event: elastic or blocker';
comment on column public.events.recurrence_pattern is 'Stores recurrence rules (e.g., RRULE string)';
comment on column public.events.is_synced is 'Flag indicating if the event is from an external calendar';
comment on column public.events.external_calendar_id is 'Reference to the external calendar it was synced from';
comment on column public.events.created_at is 'Timestamp of event creation';
comment on column public.events.updated_at is 'Timestamp of the last event update';

-- external_calendars table (referenced by events, must be created before foreign key constraint)
-- Stores connection details for external calendars (e.g., Google, Microsoft 365)
create table if not exists public.external_calendars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  account_email text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.external_calendars is 'Stores connection details for external calendars';
comment on column public.external_calendars.id is 'Unique identifier for the external calendar connection';
comment on column public.external_calendars.user_id is 'The user who owns this calendar connection';
comment on column public.external_calendars.provider is 'The calendar provider (e.g., google, microsoft)';
comment on column public.external_calendars.account_email is 'The email address associated with the external account';
comment on column public.external_calendars.access_token is 'The encrypted OAuth access token';
comment on column public.external_calendars.refresh_token is 'The encrypted OAuth refresh token';
comment on column public.external_calendars.expires_at is 'The expiration time for the access token';
comment on column public.external_calendars.last_synced_at is 'Timestamp of the last successful synchronization';
comment on column public.external_calendars.created_at is 'Timestamp of connection creation';

-- Now add the foreign key constraint to events for external_calendar_id
alter table public.events
  add constraint events_external_calendar_id_fkey
  foreign key (external_calendar_id) references public.external_calendars(id) on delete set null;

-- event_participants table
-- A polymorphic junction table linking events to their participants (users or children)
create table if not exists public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  participant_type text not null,
  primary key (event_id, user_id, child_id),
  constraint event_participants_check_exactly_one_null
    check ((user_id is null) != (child_id is null))
);

comment on table public.event_participants is 'A polymorphic junction table linking events to their participants';
comment on column public.event_participants.event_id is 'Identifier for the event';
comment on column public.event_participants.user_id is 'Identifier for a user participant (NULL if participant is a child)';
comment on column public.event_participants.child_id is 'Identifier for a child participant (NULL if participant is a user)';
comment on column public.event_participants.participant_type is 'Discriminator column: user or child';

-- event_exceptions table
-- Stores modifications or deletions for single instances of a recurring event
create table if not exists public.event_exceptions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  original_date timestamptz not null,
  new_start_time timestamptz,
  new_end_time timestamptz,
  is_cancelled boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.event_exceptions is 'Stores modifications or deletions for single instances of a recurring event';
comment on column public.event_exceptions.id is 'Unique identifier for the exception';
comment on column public.event_exceptions.event_id is 'The recurring event this exception applies to';
comment on column public.event_exceptions.original_date is 'The original start date of the recurring instance being modified';
comment on column public.event_exceptions.new_start_time is 'The new start time for the modified instance';
comment on column public.event_exceptions.new_end_time is 'The new end time for the modified instance';
comment on column public.event_exceptions.is_cancelled is 'true if this instance is cancelled';
comment on column public.event_exceptions.created_at is 'Timestamp of when the exception was created';

-- invitations table
-- Manages invitations for new members to join a family
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  invited_by uuid not null references public.users(id) on delete cascade,
  invitee_email text not null,
  token text not null unique,
  status invitation_status_enum not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.invitations is 'Manages invitations for new members to join a family';
comment on column public.invitations.id is 'Unique identifier for the invitation';
comment on column public.invitations.family_id is 'The family the invitation is for';
comment on column public.invitations.invited_by is 'The user who sent the invitation';
comment on column public.invitations.invitee_email is 'The email address of the person being invited';
comment on column public.invitations.token is 'A secure, unique token for the invitation link';
comment on column public.invitations.status is 'Status of the invitation: pending, accepted, or expired';
comment on column public.invitations.expires_at is 'The expiration date for the invitation token';
comment on column public.invitations.created_at is 'Timestamp of when the invitation was sent';

-- logs table
-- A comprehensive audit trail for user and system actions
create table if not exists public.logs (
  id bigint primary key generated always as identity,
  family_id uuid references public.families(id) on delete set null,
  actor_id uuid references public.users(id) on delete set null,
  actor_type actor_type_enum not null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

comment on table public.logs is 'A comprehensive audit trail for user and system actions';
comment on column public.logs.id is 'Auto-incrementing log entry identifier';
comment on column public.logs.family_id is 'The family context for the action, if applicable';
comment on column public.logs.actor_id is 'The user who performed the action (NULL for system actions)';
comment on column public.logs.actor_type is 'The type of actor: user or system';
comment on column public.logs.action is 'A code representing the action (e.g., event.create, user.invite)';
comment on column public.logs.details is 'A structured log of the action details (e.g., payload, changes)';
comment on column public.logs.created_at is 'Timestamp of the log entry';

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- events table indexes
-- Composite index for calendar views (family + time range)
create index if not exists idx_events_family_time_range
  on public.events (family_id, start_time, end_time);

comment on index idx_events_family_time_range is 'Speeds up queries for calendar views filtered by family and time range';

-- Index for external calendar lookups
create index if not exists idx_events_external_calendar
  on public.events (external_calendar_id)
  where external_calendar_id is not null;

comment on index idx_events_external_calendar is 'Efficiently finds events synced from a specific external calendar';

-- family_members table indexes
-- Index to find all families a user belongs to
create index if not exists idx_family_members_user_id
  on public.family_members (user_id);

comment on index idx_family_members_user_id is 'Quickly finds all families a user belongs to';

-- event_participants table indexes
-- Index to find all events a user is participating in
create index if not exists idx_event_participants_user_id
  on public.event_participants (user_id)
  where user_id is not null;

comment on index idx_event_participants_user_id is 'Finds all events a user is participating in';

-- Index to find all events a child is participating in
create index if not exists idx_event_participants_child_id
  on public.event_participants (child_id)
  where child_id is not null;

comment on index idx_event_participants_child_id is 'Finds all events a child is participating in';

-- logs table indexes
-- Index for efficient data retention policies
create index if not exists idx_logs_created_at
  on public.logs (created_at);

comment on index idx_logs_created_at is 'Supports efficient data retention policies (e.g., deleting logs older than N days)';

-- Index for querying audit trail by family or user
create index if not exists idx_logs_family_actor
  on public.logs (family_id, actor_id);

comment on index idx_logs_family_actor is 'Quickly queries the audit trail for a specific family or user';

-- invitations table indexes
-- Index to quickly look up an invitation by token
create index if not exists idx_invitations_token
  on public.invitations (token);

comment on index idx_invitations_token is 'Quickly looks up an invitation from the unique token in the URL';

-- Index to check for existing pending invitations
create index if not exists idx_invitations_email
  on public.invitations (invitee_email)
  where status = 'pending';

comment on index idx_invitations_email is 'Checks for existing pending invitations for an email address';

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.families enable row level security;
alter table public.users enable row level security;
alter table public.family_members enable row level security;
alter table public.children enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_exceptions enable row level security;
alter table public.external_calendars enable row level security;
alter table public.invitations enable row level security;
alter table public.logs enable row level security;

comment on table public.families is 'RLS enabled: Users can only see families they are members of';
comment on table public.users is 'RLS enabled: Users can see their own profile and profiles of family members';
comment on table public.family_members is 'RLS enabled: Users can see members of families they belong to';
comment on table public.children is 'RLS enabled: Users can see children in families they belong to';
comment on table public.events is 'RLS enabled: Users can see events in families they belong to';
comment on table public.event_participants is 'RLS enabled: Users can see participants of events in families they belong to';
comment on table public.event_exceptions is 'RLS enabled: Users can see exceptions for events in families they belong to';
comment on table public.external_calendars is 'RLS enabled: Users can only see their own external calendars';
comment on table public.invitations is 'RLS enabled: Users can see invitations for families they belong to';
comment on table public.logs is 'RLS enabled: Users can see logs for families they belong to';

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- families table policies
-- Select: authenticated users can see families they are members of
create policy families_select
  on public.families
  for select
  to authenticated
  using (is_family_member(id));

-- Insert: authenticated users can create families (will become admin)
create policy families_insert
  on public.families
  for insert
  to authenticated
  with check (true);

-- Update: only admins can update family details
create policy families_update
  on public.families
  for update
  to authenticated
  using (is_family_admin(id))
  with check (is_family_admin(id));

-- Delete: only admins can delete families
create policy families_delete
  on public.families
  for delete
  to authenticated
  using (is_family_admin(id));

-- users table policies
-- Select: users can see their own profile and profiles of users in their families
create policy users_select
  on public.users
  for select
  to authenticated
  using (
    id = auth.uid() or
    exists (
      select 1
      from public.family_members fm
      where fm.user_id = public.users.id
        and is_family_member(fm.family_id)
    )
  );

-- Insert: users can insert their own profile
create policy users_insert
  on public.users
  for insert
  to authenticated
  with check (id = auth.uid());

-- Update: users can only update their own profile
create policy users_update
  on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Delete: users can only delete their own profile
create policy users_delete
  on public.users
  for delete
  to authenticated
  using (id = auth.uid());

-- family_members table policies
-- Select: users can see members of families they belong to
create policy family_members_select
  on public.family_members
  for select
  to authenticated
  using (is_family_member(family_id));

-- Insert: only admins can add members (handled by invitation flow)
create policy family_members_insert
  on public.family_members
  for insert
  to authenticated
  with check (is_family_admin(family_id));

-- Update: only admins can update member roles
create policy family_members_update
  on public.family_members
  for update
  to authenticated
  using (is_family_admin(family_id))
  with check (is_family_admin(family_id));

-- Delete: admins can remove any member, users can remove themselves
create policy family_members_delete
  on public.family_members
  for delete
  to authenticated
  using (
    is_family_admin(family_id) or
    user_id = auth.uid()
  );

-- children table policies
-- Select: users can see children in families they belong to
create policy children_select
  on public.children
  for select
  to authenticated
  using (is_family_member(family_id));

-- Insert: users can add children to their families
create policy children_insert
  on public.children
  for insert
  to authenticated
  with check (is_family_member(family_id));

-- Update: users can update children in their families
create policy children_update
  on public.children
  for update
  to authenticated
  using (is_family_member(family_id))
  with check (is_family_member(family_id));

-- Delete: users can delete children from their families
create policy children_delete
  on public.children
  for delete
  to authenticated
  using (is_family_member(family_id));

-- events table policies
-- Select: users can see events in families they belong to
create policy events_select
  on public.events
  for select
  to authenticated
  using (is_family_member(family_id));

-- Insert: users can create events in their families
create policy events_insert
  on public.events
  for insert
  to authenticated
  with check (is_family_member(family_id));

-- Update: users can update events in their families
create policy events_update
  on public.events
  for update
  to authenticated
  using (is_family_member(family_id))
  with check (is_family_member(family_id));

-- Delete: users can delete events in their families
create policy events_delete
  on public.events
  for delete
  to authenticated
  using (is_family_member(family_id));

-- event_participants table policies
-- Select: users can see participants of events in families they belong to
create policy event_participants_select
  on public.event_participants
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_participants.event_id
        and is_family_member(e.family_id)
    )
  );

-- Insert: users can add participants to events in their families
create policy event_participants_insert
  on public.event_participants
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.events e
      where e.id = event_participants.event_id
        and is_family_member(e.family_id)
    )
  );

-- Update: users can update participants of events in their families
create policy event_participants_update
  on public.event_participants
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_participants.event_id
        and is_family_member(e.family_id)
    )
  )
  with check (
    exists (
      select 1
      from public.events e
      where e.id = event_participants.event_id
        and is_family_member(e.family_id)
    )
  );

-- Delete: users can remove participants from events in their families
create policy event_participants_delete
  on public.event_participants
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_participants.event_id
        and is_family_member(e.family_id)
    )
  );

-- event_exceptions table policies
-- Select: users can see exceptions for events in families they belong to
create policy event_exceptions_select
  on public.event_exceptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_exceptions.event_id
        and is_family_member(e.family_id)
    )
  );

-- Insert: users can create exceptions for events in their families
create policy event_exceptions_insert
  on public.event_exceptions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.events e
      where e.id = event_exceptions.event_id
        and is_family_member(e.family_id)
    )
  );

-- Update: users can update exceptions for events in their families
create policy event_exceptions_update
  on public.event_exceptions
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_exceptions.event_id
        and is_family_member(e.family_id)
    )
  )
  with check (
    exists (
      select 1
      from public.events e
      where e.id = event_exceptions.event_id
        and is_family_member(e.family_id)
    )
  );

-- Delete: users can delete exceptions for events in their families
create policy event_exceptions_delete
  on public.event_exceptions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_exceptions.event_id
        and is_family_member(e.family_id)
    )
  );

-- external_calendars table policies
-- Select: users can only see their own external calendars
create policy external_calendars_select
  on public.external_calendars
  for select
  to authenticated
  using (user_id = auth.uid());

-- Insert: users can create their own external calendar connections
create policy external_calendars_insert
  on public.external_calendars
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Update: users can only update their own external calendars
create policy external_calendars_update
  on public.external_calendars
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Delete: users can only delete their own external calendars
create policy external_calendars_delete
  on public.external_calendars
  for delete
  to authenticated
  using (user_id = auth.uid());

-- invitations table policies
-- Select: users can see invitations for families they belong to
create policy invitations_select
  on public.invitations
  for select
  to authenticated
  using (is_family_member(family_id));

-- Insert: only admins can create invitations
create policy invitations_insert
  on public.invitations
  for insert
  to authenticated
  with check (is_family_admin(family_id));

-- Update: only admins can update invitations
create policy invitations_update
  on public.invitations
  for update
  to authenticated
  using (is_family_admin(family_id))
  with check (is_family_admin(family_id));

-- Delete: only admins can delete invitations
create policy invitations_delete
  on public.invitations
  for delete
  to authenticated
  using (is_family_admin(family_id));

-- logs table policies
-- Select: users can see logs for families they belong to
create policy logs_select
  on public.logs
  for select
  to authenticated
  using (
    family_id is null or is_family_member(family_id)
  );

-- Insert: system can insert logs (applications will use service role key for writes)
-- Note: In production, logs should typically only be written by the application using the service role key
create policy logs_insert
  on public.logs
  for insert
  to authenticated
  with check (true);

-- Update: no updates allowed to logs (audit trail should be immutable)
-- Delete: admins can delete logs for their families only (for data retention)
create policy logs_delete
  on public.logs
  for delete
  to authenticated
  using (
    family_id is null or is_family_admin(family_id)
  );

