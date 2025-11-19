# Supabase Storage Setup Guide

## Overview
Your application needs storage buckets to store:
1. **Model training images** - Images uploaded by users to train AI models
2. **Generated photos** - AI-generated photos created for users
3. **Model previews** - Thumbnail/preview images for models (optional)

## Step-by-Step Setup

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Storage in Supabase Dashboard**
   - Navigate to your Supabase project
   - Click on "Storage" in the left sidebar

2. **Create `model-training-images` bucket**
   - Click "New bucket"
   - Name: `model-training-images`
   - Public: **No** (unchecked - private bucket)
   - File size limit: `3145728` (3MB)
   - Allowed MIME types: `image/jpeg, image/jpg, image/png`
   - Click "Create bucket"

3. **Create `generated-photos` bucket**
   - Click "New bucket"
   - Name: `generated-photos`
   - Public: **Yes** (checked - public bucket for sharing)
   - File size limit: `10485760` (10MB)
   - Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp`
   - Click "Create bucket"

4. **Create `model-previews` bucket** (Optional)
   - Click "New bucket"
   - Name: `model-previews`
   - Public: **Yes** (checked)
   - File size limit: `1048576` (1MB)
   - Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp`
   - Click "Create bucket"

5. **Apply Storage Policies**
   - After creating buckets, go to SQL Editor
   - Run the policies section from `drizzle/migrations/0004_setup_storage_buckets.sql`
   - Or copy just the policies (lines starting with `CREATE POLICY`)

### Option 2: Via SQL (If storage extension is enabled)

Run the entire `drizzle/migrations/0004_setup_storage_buckets.sql` script in SQL Editor.

## Folder Structure

Organize files in buckets using this structure:

```
model-training-images/
  {userId}/
    {modelId}/
      image1.jpg
      image2.jpg
      ...

generated-photos/
  {userId}/
    {photoId}.jpg
    {photoId}.webp
    ...

model-previews/
  {userId}/
    {modelId}.jpg
    ...
```

## Usage in Your Application

### Upload Training Image
```typescript
const { data, error } = await supabase.storage
  .from('model-training-images')
  .upload(`${userId}/${modelId}/${fileName}`, file);
```

### Upload Generated Photo
```typescript
const { data, error } = await supabase.storage
  .from('generated-photos')
  .upload(`${userId}/${photoId}.jpg`, file);
```

### Get Public URL
```typescript
const { data } = supabase.storage
  .from('generated-photos')
  .getPublicUrl(`${userId}/${photoId}.jpg`);
```

### Get Signed URL (for private files)
```typescript
const { data } = await supabase.storage
  .from('model-training-images')
  .createSignedUrl(`${userId}/${modelId}/${fileName}`, 3600); // 1 hour expiry
```

## Security Notes

1. **Private buckets** (`model-training-images`): Only the owner can access
2. **Public buckets** (`generated-photos`, `model-previews`): Anyone can view, but only owner can upload/delete
3. **Policies enforce**: Users can only upload to their own folders
4. **Path validation**: Policies check that the folder path matches the authenticated user's ID

## Troubleshooting

- **"Bucket not found"**: Make sure you created the bucket in Supabase Dashboard
- **"Policy violation"**: Check that policies were applied correctly
- **"File too large"**: Check bucket file size limits
- **"Invalid MIME type"**: Check allowed MIME types in bucket settings

## Next Steps

After setting up buckets:
1. ✅ Create buckets via Dashboard
2. ✅ Apply storage policies via SQL
3. ✅ Update your application code to use Supabase Storage client
4. ✅ Test file uploads/downloads
5. ✅ Update database URLs to point to storage paths

