-- ============================================
-- FIX STORAGE RLS POLICIES
-- ============================================
-- This script fixes the RLS policies for storage buckets
-- The issue was that policies were checking the wrong folder index
-- and not properly matching user ownership

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can upload own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own generated photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view generated photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own generated photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own generated photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own model previews" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view model previews" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own model previews" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own model previews" ON storage.objects;

-- ============================================
-- POLICIES FOR model-training-images (Private)
-- ============================================
-- Path format: training/{userId}/...

-- Users can upload their own training images
CREATE POLICY "Users can upload own training images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'model-training-images'
  AND (
    -- Path format: training/{userId}/...
    -- Check if the second folder (index 2) matches user's database ID
    (storage.foldername(name))[2] = (
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
    (storage.foldername(name))[2] = (
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
    (storage.foldername(name))[2] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

-- ============================================
-- POLICIES FOR generated-photos (Public Read, Private Write)
-- ============================================
-- Path format: generated/{userId}/...

-- Users can upload their own generated photos
CREATE POLICY "Users can upload own generated photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'generated-photos'
  AND (
    (storage.foldername(name))[2] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

-- Anyone can view generated photos (public bucket)
CREATE POLICY "Anyone can view generated photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'generated-photos');

-- Users can update their own generated photos
CREATE POLICY "Users can update own generated photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'generated-photos'
  AND (
    (storage.foldername(name))[2] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

-- Users can delete their own generated photos
CREATE POLICY "Users can delete own generated photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'generated-photos'
  AND (
    (storage.foldername(name))[2] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

-- ============================================
-- POLICIES FOR model-previews (Public Read, Private Write)
-- ============================================
-- Path format: previews/{userId}/...

-- Users can upload their own model previews
CREATE POLICY "Users can upload own model previews"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'model-previews'
  AND (
    (storage.foldername(name))[2] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

-- Anyone can view model previews (public bucket)
CREATE POLICY "Anyone can view model previews"
ON storage.objects
FOR SELECT
USING (bucket_id = 'model-previews');

-- Users can update their own model previews
CREATE POLICY "Users can update own model previews"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'model-previews'
  AND (
    (storage.foldername(name))[2] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

-- Users can delete their own model previews
CREATE POLICY "Users can delete own model previews"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'model-previews'
  AND (
    (storage.foldername(name))[2] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

