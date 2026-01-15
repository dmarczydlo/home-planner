-- Remove NOT NULL constraints from user_id and child_id in event_participants
-- These constraints were likely added when the columns were part of the primary key
-- and need to be explicitly removed to allow NULL values

-- Check if NOT NULL constraint exists before trying to drop it
DO $$
BEGIN
  -- Drop NOT NULL from user_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_participants' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.event_participants ALTER COLUMN user_id DROP NOT NULL;
  END IF;

  -- Drop NOT NULL from child_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_participants' 
    AND column_name = 'child_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.event_participants ALTER COLUMN child_id DROP NOT NULL;
  END IF;
END $$;
