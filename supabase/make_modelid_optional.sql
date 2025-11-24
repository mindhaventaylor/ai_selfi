-- Make modelId optional in photo_generation_batches and photo_generation_queue
-- This allows page2 variant to work without requiring a model

-- Update photo_generation_batches table
ALTER TABLE public.photo_generation_batches 
  ALTER COLUMN "modelId" DROP NOT NULL;

-- Update photo_generation_queue table
ALTER TABLE public.photo_generation_queue 
  ALTER COLUMN "modelId" DROP NOT NULL;

