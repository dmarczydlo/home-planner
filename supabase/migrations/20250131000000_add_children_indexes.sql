-- Migration: Add indexes for children table
-- Purpose: Optimize queries for listing children by family and ordered by creation date
-- Date: 2025-01-31

-- Index for family-based queries (most common operation)
create index if not exists idx_children_family_id 
on public.children(family_id);

comment on index idx_children_family_id is 'Optimizes queries filtering children by family_id';

-- Composite index for family + created_at (for ordered lists)
create index if not exists idx_children_family_created 
on public.children(family_id, created_at);

comment on index idx_children_family_created is 'Optimizes queries listing children by family ordered by creation date';

