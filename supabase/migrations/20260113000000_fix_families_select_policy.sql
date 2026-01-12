-- Fix families SELECT policy to allow viewing just-created families
-- This allows users to see families immediately after creation, before being added as a member

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS families_select ON public.families;

-- Create a new SELECT policy that allows:
-- 1. Viewing families where the user is a member (original behavior)
-- 2. Viewing families created in the last 10 seconds (for the creation flow)
CREATE POLICY families_select
  ON public.families
  FOR SELECT
  TO authenticated
  USING (
    is_family_member(id) 
    OR 
    (created_at > (NOW() - INTERVAL '10 seconds'))
  );
