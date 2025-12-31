-- ============================================
-- SIMPLE FIX FOR RLS POLICY
-- ============================================
-- Run this in Supabase SQL Editor while logged in
-- This is a simplified version that should work

-- First, verify your user exists
SELECT 
  id,
  "openId",
  email,
  name,
  'User exists: OK' as status
FROM public.users 
WHERE "openId" = auth.uid()::text;

-- If the query above returns no rows, your user doesn't exist in the database
-- Solution: Logout and login again, or manually insert:
-- INSERT INTO public.users ("openId", email, name, credits)
-- VALUES (auth.uid()::text, 'your-email@example.com', 'Your Name', 0)
-- ON CONFLICT ("openId") DO NOTHING;

-- Drop all existing policies for model-training-images
DROP POLICY IF EXISTS "Users can upload own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own training images" ON storage.objects;

-- Create simple, working policies
-- These check if folder[1] (the userId in the path) matches the authenticated user's database ID

CREATE POLICY "Users can upload own training images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'model-training-images'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text LIMIT 1
  )
);

CREATE POLICY "Users can view own training images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'model-training-images'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text LIMIT 1
  )
);

CREATE POLICY "Users can delete own training images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'model-training-images'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text LIMIT 1
  )
);

-- Verify policies were created
SELECT 
  policyname,
  cmd as action
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%training%'
ORDER BY cmd;

-- Test the policy logic
-- Replace 13 with your actual user ID if different
SELECT 
  'Test Path' as test,
  'training/13/test.jpg' as path,
  (storage.foldername('training/13/test.jpg'))[1] as folder_1,
  (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text LIMIT 1) as your_user_id,
  CASE 
    WHEN (storage.foldername('training/13/test.jpg'))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text LIMIT 1)
    THEN 'MATCH - Should work!'
    ELSE 'NO MATCH - Check user ID'
  END as result;

