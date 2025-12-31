-- ============================================
-- VERIFY AND FIX RLS POLICY FOR TRAINING IMAGES
-- ============================================
-- This script verifies the user exists and fixes RLS policies
-- Run this in Supabase SQL Editor

-- Step 1: Verify current user exists in users table
-- Replace '1abd0665-1563-4e31-bb57-2abfc65e2cae' with your actual Supabase Auth ID if needed
SELECT 
  id,
  "openId",
  email,
  name,
  CASE 
    WHEN "openId" = auth.uid()::text THEN 'OK - openId matches auth.uid()' 
    ELSE 'ERRO - openId does not match auth.uid()' 
  END as status
FROM public.users 
WHERE "openId" = auth.uid()::text;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "Users can upload own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own training images" ON storage.objects;

-- Step 3: Create corrected policies
-- These policies check if the folder name at index [1] matches the user's database ID
-- Path format: training/{userId}/{filename}
-- storage.foldername() returns: ['training', '{userId}']
-- So [0] = 'training', [1] = '{userId}' (the database ID as string)

CREATE POLICY "Users can upload own training images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'model-training-images'
  AND (
    -- Check if folder[1] (userId) matches the authenticated user's database ID
    (storage.foldername(name))[1] = (
      SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text
    )
  )
);

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

-- Step 4: Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%training%'
ORDER BY policyname;

-- Step 5: Test query (this should return your user if everything is correct)
-- This simulates what the RLS policy checks
SELECT 
  id::text as user_id_string,
  "openId" as supabase_auth_id,
  'training/' || id::text || '/test.jpg' as example_path,
  (storage.foldername('training/' || id::text || '/test.jpg'))[1] as folder_name_at_index_1
FROM public.users 
WHERE "openId" = auth.uid()::text;

