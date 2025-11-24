-- Create separate tables for page2 flow (no model required)
-- This keeps the page1 flow (with models) intact

-- Page2 Generation Batches
CREATE TABLE IF NOT EXISTS public.page2_generation_batches (
  id serial NOT NULL,
  "userId" integer NOT NULL,
  "totalImagesGenerated" integer NOT NULL DEFAULT 0,
  "creditsUsed" integer NOT NULL,
  "aspectRatio" text NOT NULL CHECK ("aspectRatio" IN ('1:1', '9:16', '16:9')),
  "glasses" text NOT NULL DEFAULT 'no' CHECK (glasses IN ('yes', 'no')),
  "hairColor" text CHECK ("hairColor" IN ('default', 'black', 'brown', 'blonde', 'red')),
  "hairStyle" text CHECK ("hairStyle" IN ('no-preference', 'short', 'medium', 'long', 'curly')),
  "backgrounds" jsonb DEFAULT '[]'::jsonb,
  "styles" jsonb DEFAULT '[]'::jsonb,
  "status" text NOT NULL DEFAULT 'generating' CHECK ("status" IN ('generating', 'completed', 'failed')),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "completedAt" timestamp with time zone,
  CONSTRAINT page2_generation_batches_pkey PRIMARY KEY (id),
  CONSTRAINT page2_generation_batches_userId_fkey FOREIGN KEY ("userId") 
    REFERENCES public.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Page2 Generation Queue
CREATE TABLE IF NOT EXISTS public.page2_generation_queue (
  id serial NOT NULL,
  "batchId" integer NOT NULL,
  "userId" integer NOT NULL,
  "exampleImageId" integer,
  "exampleImageUrl" text NOT NULL,
  "exampleImagePrompt" text,
  "trainingImageUrls" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "basePrompt" text NOT NULL,
  "aspectRatio" text NOT NULL CHECK ("aspectRatio" IN ('1:1', '9:16', '16:9')),
  "numImagesPerExample" integer NOT NULL DEFAULT 4,
  "glasses" text NOT NULL DEFAULT 'no' CHECK (glasses IN ('yes', 'no')),
  "hairColor" text CHECK ("hairColor" IN ('default', 'black', 'brown', 'blonde', 'red')),
  "hairStyle" text CHECK ("hairStyle" IN ('no-preference', 'short', 'medium', 'long', 'curly')),
  "backgrounds" jsonb DEFAULT '[]'::jsonb,
  "styles" jsonb DEFAULT '[]'::jsonb,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'processing', 'completed', 'failed')),
  "generatedImageUrl" text,
  "errorMessage" text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "completedAt" timestamp with time zone,
  CONSTRAINT page2_generation_queue_pkey PRIMARY KEY (id),
  CONSTRAINT page2_generation_queue_batchId_fkey FOREIGN KEY ("batchId") 
    REFERENCES public.page2_generation_batches (id) ON DELETE CASCADE,
  CONSTRAINT page2_generation_queue_userId_fkey FOREIGN KEY ("userId") 
    REFERENCES public.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page2_generation_batches_user_id 
  ON public.page2_generation_batches ("userId");
CREATE INDEX IF NOT EXISTS idx_page2_generation_batches_status 
  ON public.page2_generation_batches ("status");
CREATE INDEX IF NOT EXISTS idx_page2_generation_queue_batch_id 
  ON public.page2_generation_queue ("batchId");
CREATE INDEX IF NOT EXISTS idx_page2_generation_queue_user_id 
  ON public.page2_generation_queue ("userId");
CREATE INDEX IF NOT EXISTS idx_page2_generation_queue_status 
  ON public.page2_generation_queue ("status");

-- Enable Row Level Security (RLS)
ALTER TABLE public.page2_generation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page2_generation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page2_generation_batches
CREATE POLICY "Users can view own page2 generation batches"
ON public.page2_generation_batches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = page2_generation_batches."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can insert own page2 generation batches"
ON public.page2_generation_batches
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = page2_generation_batches."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own page2 generation batches"
ON public.page2_generation_batches
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = page2_generation_batches."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

-- RLS Policies for page2_generation_queue
CREATE POLICY "Users can view own page2 generation queue"
ON public.page2_generation_queue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = page2_generation_queue."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can insert own page2 generation queue"
ON public.page2_generation_queue
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = page2_generation_queue."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own page2 generation queue"
ON public.page2_generation_queue
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id::integer = page2_generation_queue."userId"::integer
    AND users."openId" = auth.uid()::text
  )
);

