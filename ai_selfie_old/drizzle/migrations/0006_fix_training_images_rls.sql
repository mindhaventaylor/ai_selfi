-- ============================================
-- FIX TRAINING IMAGES RLS POLICY
-- ============================================
-- This script fixes the RLS policy for model-training-images bucket
-- The issue is that storage.foldername() returns array of folder names
-- For path "training/123/file.jpg", foldername() returns ['training', '123']
-- So [0] = 'training', [1] = '123' (userId), [2] = undefined
-- The policy should check [1], not [2]

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own training images" ON storage.objects;

-- ============================================
-- CORRECTED POLICIES FOR model-training-images (Private)
-- ============================================
-- Path format: training/{userId}/{filename}
-- storage.foldername() returns: ['training', '{userId}']
-- So we check [1] for userId, not [2]

-- Users can upload their own training images
CREATE POLICY "Users can upload own training images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'model-training-images'
  AND (
    -- Path format: training/{userId}/...
    -- Check if the second folder (index 1) matches user's database ID
    (storage.foldername(name))[1] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

-- Users can view their own training images
CREATE POLICY "Users can view own training images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'model-training-images'
  AND (
    (storage.foldername(name))[1] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

-- Users can delete their own training images
CREATE POLICY "Users can delete own training images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'model-training-images'
  AND (
    (storage.foldername(name))[1] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

