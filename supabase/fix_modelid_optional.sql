-- Fix modelId to be optional in photo_generation_batches and photo_generation_queue
-- This allows page2 variant to work without requiring a model
-- Run this script in Supabase SQL Editor

-- First, check if the columns are already nullable
DO $$
BEGIN
  -- Update photo_generation_batches table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photo_generation_batches' 
    AND column_name = 'modelId'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.photo_generation_batches 
      ALTER COLUMN "modelId" DROP NOT NULL;
    RAISE NOTICE 'Made modelId nullable in photo_generation_batches';
  ELSE
    RAISE NOTICE 'modelId is already nullable in photo_generation_batches';
  END IF;

  -- Update photo_generation_queue table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photo_generation_queue' 
    AND column_name = 'modelId'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.photo_generation_queue 
      ALTER COLUMN "modelId" DROP NOT NULL;
    RAISE NOTICE 'Made modelId nullable in photo_generation_queue';
  ELSE
    RAISE NOTICE 'modelId is already nullable in photo_generation_queue';
  END IF;
END $$;

