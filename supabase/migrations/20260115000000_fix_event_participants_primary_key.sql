-- Fix event_participants table primary key to allow NULLs
-- The original primary key (event_id, user_id, child_id) doesn't work with nullable columns
-- Solution: Add an ID column as primary key and use partial unique indexes

-- Step 1: Drop the old primary key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'event_participants_pkey' 
    AND contype = 'p'
    AND conrelid = 'public.event_participants'::regclass
  ) THEN
    ALTER TABLE public.event_participants DROP CONSTRAINT event_participants_pkey;
  END IF;
END $$;

-- Step 2: Add an ID column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_participants' 
    AND column_name = 'id'
  ) THEN
    ALTER TABLE public.event_participants
    ADD COLUMN id uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Step 3: Update existing rows to have IDs if they don't
UPDATE public.event_participants
SET id = gen_random_uuid()
WHERE id IS NULL;

-- Step 4: Make id NOT NULL and set as primary key
ALTER TABLE public.event_participants
ALTER COLUMN id SET NOT NULL,
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 5: Remove NOT NULL constraints from user_id and child_id (they were added by the primary key)
-- These columns need to be nullable for the polymorphic relationship
ALTER TABLE public.event_participants
ALTER COLUMN user_id DROP NOT NULL,
ALTER COLUMN child_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'event_participants_pkey' 
    AND contype = 'p'
  ) THEN
    ALTER TABLE public.event_participants
    ADD CONSTRAINT event_participants_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Step 6: Add partial unique indexes to prevent duplicate participants
-- These indexes only apply when the respective ID is NOT NULL
DROP INDEX IF EXISTS event_participants_unique_user;
CREATE UNIQUE INDEX event_participants_unique_user
ON public.event_participants (event_id, user_id)
WHERE user_id IS NOT NULL;

DROP INDEX IF EXISTS event_participants_unique_child;
CREATE UNIQUE INDEX event_participants_unique_child
ON public.event_participants (event_id, child_id)
WHERE child_id IS NOT NULL;

COMMENT ON COLUMN public.event_participants.id IS 'Unique identifier for the participant record';
