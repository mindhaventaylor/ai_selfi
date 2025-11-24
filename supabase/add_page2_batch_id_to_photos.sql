-- Add page2GenerationBatchId column to photos table if it doesn't exist
-- This column links photos generated in the page2 flow to their batch

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'photos'
        AND column_name = 'page2GenerationBatchId'
    ) THEN
        ALTER TABLE public.photos
        ADD COLUMN "page2GenerationBatchId" INTEGER 
        REFERENCES public.page2_generation_batches(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Column page2GenerationBatchId added to public.photos.';
    ELSE
        RAISE NOTICE 'Column page2GenerationBatchId already exists in public.photos.';
    END IF;
END $$;

