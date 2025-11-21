-- ============================================
-- DIAGNOSE AND FIX RLS POLICY ISSUE
-- ============================================
-- Run this script in Supabase SQL Editor while logged in
-- It will diagnose the issue and apply the fix

-- Step 1: Check if user exists with correct openId
DO $$
DECLARE
  current_auth_uid TEXT;
  user_record RECORD;
BEGIN
  -- Get current authenticated user ID
  current_auth_uid := auth.uid()::text;
  
  RAISE NOTICE 'Current Supabase Auth ID: %', current_auth_uid;
  
  -- Check if user exists
  SELECT id, "openId", email, name 
  INTO user_record
  FROM public.users 
  WHERE "openId" = current_auth_uid;
  
  IF user_record IS NULL THEN
    RAISE NOTICE 'ERRO: Usuário não encontrado na tabela users com openId = %', current_auth_uid;
    RAISE NOTICE 'Solução: Faça logout e login novamente para criar o registro automaticamente';
  ELSE
    RAISE NOTICE 'OK: Usuário encontrado - ID: %, Email: %, Nome: %', 
      user_record.id, user_record.email, user_record.name;
    RAISE NOTICE 'User ID (string): %', user_record.id::text;
  END IF;
END $$;

-- Step 2: Show current user info
SELECT 
  id,
  id::text as id_as_string,
  "openId",
  email,
  name,
  auth.uid()::text as current_auth_uid,
  CASE 
    WHEN "openId" = auth.uid()::text THEN 'OK' 
    ELSE 'ERRO' 
  END as match_status
FROM public.users 
WHERE "openId" = auth.uid()::text;

-- Step 3: Test the RLS policy logic
-- This simulates what happens when uploading to training/13/file.jpg
SELECT 
  'training/13/test.jpg' as test_path,
  (storage.foldername('training/13/test.jpg'))[0] as folder_0,
  (storage.foldername('training/13/test.jpg'))[1] as folder_1,
  (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text) as user_id_from_policy,
  CASE 
    WHEN (storage.foldername('training/13/test.jpg'))[1] = (SELECT id::text FROM public.users WHERE "openId" = auth.uid()::text)
    THEN 'MATCH - Policy would allow'
    ELSE 'NO MATCH - Policy would deny'
  END as policy_result;

-- Step 4: Drop and recreate policies with better error handling
DROP POLICY IF EXISTS "Users can upload own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own training images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own training images" ON storage.objects;

-- Create policies with explicit NULL check
CREATE POLICY "Users can upload own training images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'model-training-images'
  AND (
    -- Ensure user exists and folder[1] matches user's database ID
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE "openId" = auth.uid()::text
      AND id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Users can view own training images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'model-training-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE "openId" = auth.uid()::text
      AND id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Users can delete own training images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'model-training-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE "openId" = auth.uid()::text
      AND id::text = (storage.foldername(name))[1]
    )
  )
);

-- Step 5: Verify policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'SELECT' THEN 'View'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd
  END as action
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%training%'
ORDER BY cmd;

-- Step 6: Final verification
-- This should return your user if everything is correct
SELECT 
  'Verificação Final' as status,
  id as user_id,
  id::text as user_id_string,
  "openId" as supabase_auth_id,
  'training/' || id::text || '/test.jpg' as example_path,
  (storage.foldername('training/' || id::text || '/test.jpg'))[1] as folder_name,
  CASE 
    WHEN (storage.foldername('training/' || id::text || '/test.jpg'))[1] = id::text THEN 'OK'
    ELSE 'ERRO'
  END as path_match
FROM public.users 
WHERE "openId" = auth.uid()::text;

