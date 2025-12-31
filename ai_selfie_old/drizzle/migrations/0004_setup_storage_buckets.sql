-- ============================================
-- SUPABASE STORAGE BUCKETS SETUP
-- ============================================

-- This script creates the necessary storage buckets for the application
-- Run this in Supabase SQL Editor

-- Note: Storage buckets are created via Supabase Storage API or Dashboard
-- This SQL script documents what buckets are needed and their policies

-- ============================================
-- REQUIRED BUCKETS
-- ============================================

-- 1. model-training-images
--    Purpose: Store images uploaded for training models (1-5 images per model)
--    Public: No (private)
--    File size limit: 3MB per file
--    Allowed MIME types: image/jpeg, image/jpg, image/png

-- 2. generated-photos
--    Purpose: Store AI-generated photos for users
--    Public: Yes (users need to share/download their photos)
--    File size limit: 10MB per file (for high-quality images)
--    Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp

-- 3. model-previews (optional)
--    Purpose: Store preview/thumbnail images for models
--    Public: Yes (for displaying in ViewModels page)
--    File size limit: 1MB per file
--    Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp

-- ============================================
-- HOW TO CREATE BUCKETS
-- ============================================

-- Option 1: Via Supabase Dashboard
-- 1. Go to Storage section in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Create each bucket with the settings below

-- Option 2: Via SQL (if you have storage extension enabled)
-- Note: This may not work in all Supabase setups

-- Create model-training-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'model-training-images',
  'model-training-images',
  false,
  3145728, -- 3MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Create generated-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-photos',
  'generated-photos',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create model-previews bucket (optional)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'model-previews',
  'model-previews',
  true,
  1048576, -- 1MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- ============================================
-- POLICIES FOR model-training-images (Private)
-- ============================================

-- Users can upload their own training images
CREATE POLICY "Users can upload own training images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'model-training-images'
  AND (
    -- Check if the path matches a model they own
    -- Path format: {userId}/{modelId}/{filename}
    (storage.foldername(name))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text)
  )
);

-- Users can view their own training images
CREATE POLICY "Users can view own training images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'model-training-images'
  AND (
    (storage.foldername(name))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text)
  )
);

-- Users can delete their own training images
CREATE POLICY "Users can delete own training images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'model-training-images'
  AND (
    (storage.foldername(name))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text)
  )
);

-- ============================================
-- POLICIES FOR generated-photos (Public Read, Private Write)
-- ============================================

-- Users can upload their own generated photos
CREATE POLICY "Users can upload own generated photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'generated-photos'
  AND (
    (storage.foldername(name))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text)
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
    (storage.foldername(name))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text)
  )
);

-- Users can delete their own generated photos
CREATE POLICY "Users can delete own generated photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'generated-photos'
  AND (
    (storage.foldername(name))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text)
  )
);

-- ============================================
-- POLICIES FOR model-previews (Public Read, Private Write)
-- ============================================

-- Users can upload their own model previews
CREATE POLICY "Users can upload own model previews"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'model-previews'
  AND (
    (storage.foldername(name))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text)
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
    (storage.foldername(name))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text)
  )
);

-- Users can delete their own model previews
CREATE POLICY "Users can delete own model previews"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'model-previews'
  AND (
    (storage.foldername(name))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text)
  )
);

-- ============================================
-- RECOMMENDED FOLDER STRUCTURE
-- ============================================

-- model-training-images/
--   {userId}/
--     {modelId}/
--       image1.jpg
--       image2.jpg
--       ...

-- generated-photos/
--   {userId}/
--     {photoId}.jpg
--     {photoId}.webp
--     ...

-- model-previews/
--   {userId}/
--     {modelId}.jpg
--     ...

-- ============================================
-- NOTES
-- ============================================

-- 1. The SQL INSERT method may not work if storage extension is not enabled
-- 2. It's recommended to create buckets via Supabase Dashboard first
-- 3. Then run the policies section of this script
-- 4. File paths should follow the folder structure above
-- 5. Use Supabase Storage JavaScript client in your app to upload files
-- 6. Example: supabase.storage.from('model-training-images').upload(path, file)

