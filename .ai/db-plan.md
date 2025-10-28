# Home Planner: Database Schema Plan

This document outlines the comprehensive PostgreSQL database schema for the Home Planner application, designed for implementation with Supabase.

## 1. Tables

### 1.1. `public.families`

Stores the central family units.

| Column Name  | Data Type     | Constraints                              | Description                                  |
| ------------ | ------------- | ---------------------------------------- | -------------------------------------------- |
| `id`         | `uuid`        | Primary Key, `default gen_random_uuid()` | Unique identifier for the family.            |
| `name`       | `text`        | Not Null                                 | The name of the family (e.g., "The Smiths"). |
| `created_at` | `timestamptz` | Not Null, `default now()`                | Timestamp of when the family was created.    |

### 1.2. `public.users`

Stores public-facing user profile information, extending the `auth.users` table.

| Column Name  | Data Type     | Constraints                                 | Description                                          |
| ------------ | ------------- | ------------------------------------------- | ---------------------------------------------------- |
| `id`         | `uuid`        | Primary Key, Foreign Key to `auth.users.id` | Mirrors the `id` from Supabase's `auth.users` table. |
| `full_name`  | `text`        |                                             | User's full name.                                    |
| `avatar_url` | `text`        |                                             | URL for the user's profile picture.                  |
| `updated_at` | `timestamptz` | `default now()`                             | Timestamp of the last profile update.                |

### 1.3. `public.family_members`

A junction table linking users to families and defining their roles.

| Column Name | Data Type     | Constraints                                      | Description                                               |
| ----------- | ------------- | ------------------------------------------------ | --------------------------------------------------------- |
| `family_id` | `uuid`        | Primary Key, Foreign Key to `public.families.id` | Identifier for the family.                                |
| `user_id`   | `uuid`        | Primary Key, Foreign Key to `public.users.id`    | Identifier for the user.                                  |
| `role`      | `text`        | Not Null, `default 'member'`                     | Role of the user in the family (e.g., 'admin', 'member'). |
| `joined_at` | `timestamptz` | Not Null, `default now()`                        | Timestamp of when the user joined the family.             |

### 1.4. `public.children`

Stores profiles for children, who do not have their own user accounts.

| Column Name  | Data Type     | Constraints                                   | Description                                      |
| ------------ | ------------- | --------------------------------------------- | ------------------------------------------------ |
| `id`         | `uuid`        | Primary Key, `default gen_random_uuid()`      | Unique identifier for the child.                 |
| `family_id`  | `uuid`        | Not Null, Foreign Key to `public.families.id` | The family the child belongs to.                 |
| `name`       | `text`        | Not Null                                      | The child's name.                                |
| `created_at` | `timestamptz` | Not Null, `default now()`                     | Timestamp of when the child profile was created. |

### 1.5. `public.events`

The core table for all scheduled events and tasks.

| Column Name            | Data Type     | Constraints                                             | Description                                                |
| ---------------------- | ------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| `id`                   | `uuid`        | Primary Key, `default gen_random_uuid()`                | Unique identifier for the event.                           |
| `family_id`            | `uuid`        | Not Null, Foreign Key to `public.families.id`           | The family this event belongs to.                          |
| `title`                | `text`        | Not Null                                                | The title or name of the event.                            |
| `start_time`           | `timestamptz` | Not Null                                                | The start time of the event (in UTC).                      |
| `end_time`             | `timestamptz` | Not Null                                                | The end time of the event (in UTC).                        |
| `is_all_day`           | `boolean`     | Not Null, `default false`                               | Flag for events that last the entire day.                  |
| `event_type`           | `text`        | Not Null, `default 'elastic'`                           | Type of event: 'elastic' or 'blocker'.                     |
| `recurrence_pattern`   | `jsonb`       | Nullable                                                | Stores recurrence rules (e.g., RRULE string).              |
| `is_synced`            | `boolean`     | Not Null, `default false`                               | Flag indicating if the event is from an external calendar. |
| `external_calendar_id` | `uuid`        | Nullable, Foreign Key to `public.external_calendars.id` | Reference to the external calendar it was synced from.     |
| `created_at`           | `timestamptz` | Not Null, `default now()`                               | Timestamp of event creation.                               |
| `updated_at`           | `timestamptz` | `default now()`                                         | Timestamp of the last event update.                        |

### 1.6. `public.event_participants`

A polymorphic junction table linking events to their participants (users or children).

| Column Name        | Data Type | Constraints                                                 | Description                                                          |
| ------------------ | --------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `event_id`         | `uuid`    | Primary Key, Foreign Key to `public.events.id`              | Identifier for the event.                                            |
| `user_id`          | `uuid`    | Primary Key (nullable), Foreign Key to `public.users.id`    | Identifier for a user participant. `NULL` if participant is a child. |
| `child_id`         | `uuid`    | Primary Key (nullable), Foreign Key to `public.children.id` | Identifier for a child participant. `NULL` if participant is a user. |
| `participant_type` | `text`    | Not Null                                                    | Discriminator column: 'user' or 'child'.                             |

### 1.7. `public.event_exceptions`

Stores modifications or deletions for single instances of a recurring event.

| Column Name      | Data Type     | Constraints                                 | Description                                                       |
| ---------------- | ------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| `id`             | `uuid`        | Primary Key, `default gen_random_uuid()`    | Unique identifier for the exception.                              |
| `event_id`       | `uuid`        | Not Null, Foreign Key to `public.events.id` | The recurring event this exception applies to.                    |
| `original_date`  | `timestamptz` | Not Null                                    | The original start date of the recurring instance being modified. |
| `new_start_time` | `timestamptz` | Nullable                                    | The new start time for the modified instance.                     |
| `new_end_time`   | `timestamptz` | Nullable                                    | The new end time for the modified instance.                       |
| `is_cancelled`   | `boolean`     | Not Null, `default false`                   | `true` if this instance is cancelled.                             |
| `created_at`     | `timestamptz` | Not Null, `default now()`                   | Timestamp of when the exception was created.                      |

### 1.8. `public.external_calendars`

Stores connection details for external calendars (e.g., Google, Microsoft 365).

| Column Name      | Data Type     | Constraints                                | Description                                             |
| ---------------- | ------------- | ------------------------------------------ | ------------------------------------------------------- |
| `id`             | `uuid`        | Primary Key, `default gen_random_uuid()`   | Unique identifier for the external calendar connection. |
| `user_id`        | `uuid`        | Not Null, Foreign Key to `public.users.id` | The user who owns this calendar connection.             |
| `provider`       | `text`        | Not Null                                   | The calendar provider (e.g., 'google', 'microsoft').    |
| `account_email`  | `text`        | Not Null                                   | The email address associated with the external account. |
| `access_token`   | `text`        | Not Null                                   | The encrypted OAuth access token.                       |
| `refresh_token`  | `text`        | Not Null                                   | The encrypted OAuth refresh token.                      |
| `expires_at`     | `timestamptz` | Nullable                                   | The expiration time for the access token.               |
| `last_synced_at` | `timestamptz` | Nullable                                   | Timestamp of the last successful synchronization.       |
| `created_at`     | `timestamptz` | Not Null, `default now()`                  | Timestamp of connection creation.                       |

### 1.9. `public.invitations`

Manages invitations for new members to join a family.

| Column Name     | Data Type     | Constraints                                   | Description                                                 |
| --------------- | ------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `id`            | `uuid`        | Primary Key, `default gen_random_uuid()`      | Unique identifier for the invitation.                       |
| `family_id`     | `uuid`        | Not Null, Foreign Key to `public.families.id` | The family the invitation is for.                           |
| `invited_by`    | `uuid`        | Not Null, Foreign Key to `public.users.id`    | The user who sent the invitation.                           |
| `invitee_email` | `text`        | Not Null                                      | The email address of the person being invited.              |
| `token`         | `text`        | Not Null, Unique                              | A secure, unique token for the invitation link.             |
| `status`        | `text`        | Not Null, `default 'pending'`                 | Status of the invitation: 'pending', 'accepted', 'expired'. |
| `expires_at`    | `timestamptz` | Not Null                                      | The expiration date for the invitation token.               |
| `created_at`    | `timestamptz` | Not Null, `default now()`                     | Timestamp of when the invitation was sent.                  |

### 1.10. `public.logs`

A comprehensive audit trail for user and system actions.

| Column Name  | Data Type     | Constraints                                   | Description                                                           |
| ------------ | ------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| `id`         | `bigint`      | Primary Key, Identity                         | Auto-incrementing log entry identifier.                               |
| `family_id`  | `uuid`        | Nullable, Foreign Key to `public.families.id` | The family context for the action, if applicable.                     |
| `actor_id`   | `uuid`        | Nullable, Foreign Key to `public.users.id`    | The user who performed the action. `NULL` for system actions.         |
| `actor_type` | `text`        | Not Null                                      | The type of actor: 'user' or 'system'.                                |
| `action`     | `text`        | Not Null                                      | A code representing the action (e.g., 'event.create', 'user.invite'). |
| `details`    | `jsonb`       | Nullable                                      | A structured log of the action details (e.g., payload, changes).      |
| `created_at` | `timestamptz` | Not Null, `default now()`                     | Timestamp of the log entry.                                           |

## 2. Relationships

- **`families` to `family_members`**: One-to-Many. A family can have multiple members.
- **`users` to `family_members`**: One-to-Many. A user can be a member of multiple families.
- **`families` to `children`**: One-to-Many. A family can have multiple children.
- **`families` to `events`**: One-to-Many. A family has its own set of events.
- **`events` to `event_participants`**: One-to-Many. An event can have multiple participants.
- **`users` to `event_participants`**: One-to-Many. A user can participate in many events.
- **`children` to `event_participants`**: One-to-Many. A child can participate in many events.
- **`events` to `event_exceptions`**: One-to-Many. A recurring event can have multiple exceptions.
- **`users` to `external_calendars`**: One-to-Many. A user can connect multiple external calendars.
- **`families` to `invitations`**: One-to-Many. A family can have multiple pending invitations.

## 3. Indexes

- **`events`**:
  - `(family_id, start_time, end_time)`: Composite index to significantly speed up queries for calendar views, which are always filtered by family and a time range.
  - `(external_calendar_id)`: To efficiently find events synced from a specific external calendar.
- **`family_members`**:
  - `(user_id)`: To quickly find all families a user belongs to.
- **`event_participants`**:
  - `(user_id)`: To find all events a user is participating in.
  - `(child_id)`: To find all events a child is participating in.
- **`logs`**:
  - `(created_at)`: To support efficient data retention policies (e.g., deleting logs older than N days).
  - `(family_id, actor_id)`: To quickly query the audit trail for a specific family or user.
- **`invitations`**:
  - `(token)`: To quickly look up an invitation from the unique token in the URL.
  - `(invitee_email)`: To check for existing pending invitations for an email address.

## 4. PostgreSQL Policies (RLS)

Row-Level Security (RLS) will be enabled on all tables to ensure data isolation between families.

### General Policy Structure:

A user can only access a row if they are a member of the family that owns that row. This is checked via a helper function `is_family_member(family_id)`.

- **`families` Table:**

  - `SELECT`: A user can see a family's details if they are a member of that family.
  - `INSERT`, `UPDATE`, `DELETE`: Restricted to users with the 'admin' role within that family.

- **`events`, `children`, `invitations` Tables:**

  - `SELECT`: A user can view these records if they are a member of the associated `family_id`.
  - `INSERT`, `UPDATE`, `DELETE`: A user can manage these records if they are a member of the associated `family_id`. (Further granularity for 'admin' vs 'member' roles on invitations can be added).

- **`users` Table:**

  - `SELECT`: A user can view their own profile. They can also view the profiles of other users who are members of the same families.
  - `UPDATE`: A user can only update their own profile (`id = auth.uid()`).

- **`family_members` Table:**
  - `SELECT`: A user can see all members of the families they belong to.
  - `DELETE`: Only an 'admin' can remove a member from a family. A member can remove themselves.
  - `INSERT`: Only an 'admin' can add a new member (this is handled by the invitation flow).

## 5. Additional Notes

- **Encryption**: Columns containing sensitive data (`access_token`, `refresh_token` in `external_calendars`) must be encrypted at the application or database level. The schema assumes a mechanism like `pgsodium` will be used.
- **Enums**: While `text` is used for simplicity in this plan for columns like `role`, `event_type`, and `status`, using PostgreSQL `ENUM` types in the final implementation is highly recommended for data integrity and performance.
- **Cascade Deletes**: Foreign key constraints should be defined with `ON DELETE CASCADE` where appropriate. For example, deleting a family should cascade to delete all its associated members, children, and events. Deleting a user should cascade to remove their family memberships and external calendar connections.
