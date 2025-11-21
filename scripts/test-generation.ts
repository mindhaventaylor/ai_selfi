// Script to test image generation locally without frontend
// Usage: tsx scripts/test-generation.ts

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyA-7_0RKEYOcDRkwBuVlJTWQycGh5tW8K8';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Make sure these are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestConfig {
  userId: number;
  modelId: number;
  exampleImageUrl: string;
  exampleImagePrompt: string;
  trainingImageUrls: string[];
  basePrompt: string;
  aspectRatio: '1:1' | '9:16' | '16:9';
  numImagesPerExample: number;
}

async function testGeneration() {
  console.log('🧪 Testing Image Generation Locally\n');
  console.log('='.repeat(60));

  // Step 1: Get or create a test user
  console.log('\n📋 Step 1: Getting test user...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (usersError || !users || users.length === 0) {
    console.error('❌ No users found. Please create a user first.');
    process.exit(1);
  }

  const userId = users[0].id;
  console.log(`✅ Using user ID: ${userId}`);

  // Step 2: Get or create a test model
  console.log('\n📋 Step 2: Getting test model...');
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('id, status')
    .eq('userId', userId)
    .eq('status', 'ready')
    .limit(1);

  if (modelsError || !models || models.length === 0) {
    console.error('❌ No ready models found for this user.');
    console.error('   Please create and train a model first.');
    process.exit(1);
  }

  const modelId = models[0].id;
  console.log(`✅ Using model ID: ${modelId}`);

  // Step 3: Get training images for the model
  console.log('\n📋 Step 3: Getting training images...');
  const { data: trainingImages, error: trainingError } = await supabase
    .from('model_training_images')
    .select('imageUrl')
    .eq('modelId', modelId)
    .order('imageOrder', { ascending: true })
    .limit(5);

  if (trainingError || !trainingImages || trainingImages.length === 0) {
    console.error('❌ No training images found for this model.');
    process.exit(1);
  }

  const trainingImageUrls = trainingImages.map(img => img.imageUrl);
  console.log(`✅ Found ${trainingImageUrls.length} training images`);

  // Step 4: Use example image from Supabase Storage
  const exampleImageUrl = 'https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image_1.webp';
  const exampleImagePrompt = 'Create a casual yet elegant portrait with modern clothing, natural expression, soft lighting, contemporary style';

  // Step 5: Create generation batch
  console.log('\n📋 Step 4: Creating generation batch...');
  const totalImagesToGenerate = 4;
  const creditsPerImage = 1;
  const totalCredits = totalImagesToGenerate * creditsPerImage;

  // Check user credits
  const { data: userData } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (!userData || userData.credits < totalCredits) {
    console.warn(`⚠️  User has ${userData?.credits || 0} credits, needs ${totalCredits}`);
    console.log('   Continuing anyway for testing...');
  }

  const { data: batch, error: batchError } = await supabase
    .from('photo_generation_batches')
    .insert({
      userId,
      modelId,
      totalImagesGenerated: totalImagesToGenerate,
      creditsUsed: totalCredits,
      aspectRatio: '9:16',
      glasses: 'no',
      hairColor: 'default',
      hairStyle: 'no-preference',
      backgrounds: [],
      styles: [],
      status: 'generating',
    })
    .select()
    .single();

  if (batchError || !batch) {
    console.error('❌ Failed to create batch:', batchError);
    process.exit(1);
  }

  console.log(`✅ Created batch ID: ${batch.id}`);

  // Step 6: Enqueue jobs
  console.log('\n📋 Step 5: Enqueuing generation jobs...');
  const basePrompt = 'Generate a high-quality portrait photo with professional lighting and composition';

  const queueJob = {
    batchId: batch.id,
    userId,
    modelId,
    exampleImageId: 2, // Example image ID
    exampleImageUrl,
    exampleImagePrompt,
    trainingImageUrls,
    basePrompt,
    aspectRatio: '9:16' as const,
    numImagesPerExample: totalImagesToGenerate,
    glasses: 'no',
    hairColor: null,
    hairStyle: null,
    backgrounds: [],
    styles: [],
    status: 'pending',
    attempts: 0,
    maxAttempts: 5,
    retryAt: null,
  };

  const { data: jobs, error: queueError } = await supabase
    .from('photo_generation_queue')
    .insert(queueJob)
    .select();

  if (queueError || !jobs || jobs.length === 0) {
    console.error('❌ Failed to enqueue job:', queueError);
    process.exit(1);
  }

  console.log(`✅ Enqueued job ID: ${jobs[0].id}`);
  console.log(`\n📊 Test Summary:`);
  console.log(`   - Batch ID: ${batch.id}`);
  console.log(`   - Job ID: ${jobs[0].id}`);
  console.log(`   - User ID: ${userId}`);
  console.log(`   - Model ID: ${modelId}`);
  console.log(`   - Training images: ${trainingImageUrls.length}`);
  console.log(`   - Images to generate: ${totalImagesToGenerate}`);
  console.log(`\n✅ Jobs enqueued successfully!`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Start the worker: ./start-worker.sh`);
  console.log(`   2. Or run: deno run --allow-net --allow-env supabase/functions/process-generation-queue/index.ts`);
  console.log(`   3. Monitor progress with:`);
  console.log(`      SELECT * FROM photo_generation_queue WHERE id = ${jobs[0].id};`);
  console.log(`      SELECT * FROM photo_generation_batches WHERE id = ${batch.id};`);
  console.log(`      SELECT * FROM photos WHERE "generationBatchId" = ${batch.id};`);
}

testGeneration().catch(console.error);

