// Script to upload example images to Supabase Storage
// Run with: tsx scripts/upload-example-images.ts

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const exampleImages = [
  { name: 'image.webp', path: 'client/public/image.webp' },
  { name: 'image_1.webp', path: 'client/public/image_1.webp' },
  { name: 'image_10.webp', path: 'client/public/image_10.webp' },
  { name: 'image_100.jpg', path: 'client/public/image_100.jpg' },
  { name: 'image_101.jpg', path: 'client/public/image_101.jpg' },
  { name: 'image_102.jpg', path: 'client/public/image_102.jpg' },
];

async function uploadExampleImages() {
  console.log('Starting upload of example images to Supabase Storage...\n');

  // Check if bucket exists, create if not
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }

  const bucketExists = buckets?.some(b => b.name === 'example-images');
  
  if (!bucketExists) {
    console.log('Creating bucket "example-images"...');
    const { error: createError } = await supabase.storage.createBucket('example-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      return;
    }
    console.log('✅ Bucket created\n');
  } else {
    console.log('✅ Bucket "example-images" already exists\n');
  }

  const uploadedUrls: Array<{ name: string; url: string }> = [];

  for (const image of exampleImages) {
    try {
      const filePath = join(process.cwd(), image.path);
      const fileBuffer = readFileSync(filePath);
      
      console.log(`Uploading ${image.name}...`);
      
      const { data, error } = await supabase.storage
        .from('example-images')
        .upload(image.name, fileBuffer, {
          contentType: image.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
          upsert: true, // Overwrite if exists
        });

      if (error) {
        console.error(`❌ Error uploading ${image.name}:`, error.message);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('example-images')
        .getPublicUrl(image.name);

      uploadedUrls.push({
        name: image.name,
        url: urlData.publicUrl,
      });

      console.log(`✅ Uploaded: ${urlData.publicUrl}\n`);
    } catch (error) {
      console.error(`❌ Error processing ${image.name}:`, error);
    }
  }

  console.log('\n=== Upload Summary ===');
  console.log(`Uploaded ${uploadedUrls.length}/${exampleImages.length} images\n`);
  
  console.log('Update client/src/data/exampleImages.ts with these URLs:');
  console.log('\n');
  
  uploadedUrls.forEach(({ name, url }) => {
    // Find the image ID from the original data
    const imageId = exampleImages.findIndex(img => img.name === name) + 1;
    console.log(`  id: ${imageId}, url: "${url}",`);
  });
}

uploadExampleImages().catch(console.error);

