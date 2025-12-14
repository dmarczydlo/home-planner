-- ============================================================================
-- Add indexes for logs table query optimization
-- ============================================================================
-- This migration adds indexes to optimize the /api/logs endpoint queries
-- based on the implementation plan requirements.

-- Composite index for family_id and created_at (most common query pattern)
-- This index optimizes queries that filter by family and date range
create index if not exists idx_logs_family_created 
  on public.logs(family_id, created_at desc);

comment on index idx_logs_family_created is 'Optimizes queries filtering logs by family and date range, ordered by most recent first';

-- Index for actor_id filtering
-- This index optimizes queries that filter by specific user who performed actions
create index if not exists idx_logs_actor 
  on public.logs(actor_id)
  where actor_id is not null;

comment on index idx_logs_actor is 'Optimizes queries filtering logs by the user who performed the action';

-- Index for action type filtering
-- This index optimizes queries that filter by action type (e.g., event.create, family.update)
create index if not exists idx_logs_action 
  on public.logs(action);

comment on index idx_logs_action is 'Optimizes queries filtering logs by action type';

-- Note: idx_logs_created_at already exists in the base schema
-- Note: idx_logs_family_actor already exists but covers different use case (family + actor together)

