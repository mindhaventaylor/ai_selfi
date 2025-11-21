-- Create photo_generation_queue table for async job processing
CREATE TABLE IF NOT EXISTS public.photo_generation_queue (
  id serial NOT NULL,
  "batchId" integer NOT NULL,
  "userId" integer NOT NULL,
  "modelId" integer NOT NULL,
  "exampleImageId" integer NOT NULL,
  "exampleImageUrl" text NOT NULL,
  "exampleImagePrompt" text NOT NULL,
  "trainingImageUrls" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "basePrompt" text NOT NULL,
  "aspectRatio" text NOT NULL CHECK ("aspectRatio" IN ('1:1', '9:16', '16:9')),
  "numImagesPerExample" integer NOT NULL DEFAULT 4,
  "glasses" text NOT NULL,
  "hairColor" text,
  "hairStyle" text,
  "backgrounds" jsonb DEFAULT '[]'::jsonb,
  "styles" jsonb DEFAULT '[]'::jsonb,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'processing', 'completed', 'failed', 'rate_limited')),
  "attempts" integer NOT NULL DEFAULT 0,
  "maxAttempts" integer NOT NULL DEFAULT 5,
  "retryAt" timestamp with time zone,
  "lockedBy" text,
  "lockedAt" timestamp with time zone,
  "errorMessage" text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "processedAt" timestamp with time zone,
  "completedAt" timestamp with time zone,
  CONSTRAINT photo_generation_queue_pkey PRIMARY KEY (id),
  CONSTRAINT photo_generation_queue_batchId_fkey FOREIGN KEY ("batchId") 
    REFERENCES public.photo_generation_batches (id) ON DELETE CASCADE,
  CONSTRAINT photo_generation_queue_userId_fkey FOREIGN KEY ("userId") 
    REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT photo_generation_queue_modelId_fkey FOREIGN KEY ("modelId") 
    REFERENCES public.models (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Create index for efficient job polling
CREATE INDEX IF NOT EXISTS idx_photo_generation_queue_status_retry_at 
  ON public.photo_generation_queue ("status", "retryAt") 
  WHERE "status" IN ('pending', 'rate_limited');

-- Create index for batch queries
CREATE INDEX IF NOT EXISTS idx_photo_generation_queue_batch_id 
  ON public.photo_generation_queue ("batchId");

