-- Fix family_members INSERT policy to allow adding yourself to newly created families
-- This solves the chicken-and-egg problem where you need to be an admin to add members,
-- but you can't be an admin until you're added as a member

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS family_members_insert ON public.family_members;

-- Create a new INSERT policy that allows:
-- 1. Admins to add any member (original behavior)
-- 2. Any authenticated user to add themselves to a family created in the last 10 seconds
CREATE POLICY family_members_insert
  ON public.family_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_family_admin(family_id)
    OR
    (
      user_id = auth.uid()
      AND
      EXISTS (
        SELECT 1 FROM public.families
        WHERE id = family_id
        AND created_at > (NOW() - INTERVAL '10 seconds')
      )
    )
  );
