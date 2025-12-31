// Script to monitor queue status
// Usage: tsx scripts/monitor-queue.ts [batchId]

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function monitorQueue(batchId?: number) {
  console.log('📊 Queue Status Monitor\n');
  console.log('='.repeat(60));

  if (batchId) {
    // Monitor specific batch
    console.log(`\n📋 Batch ${batchId} Status:\n`);

    const { data: batch } = await supabase
      .from('photo_generation_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batch) {
      console.log(`Status: ${batch.status}`);
      console.log(`Total Images: ${batch.totalImagesGenerated}`);
      console.log(`Credits Used: ${batch.creditsUsed}`);
      console.log(`Created: ${batch.createdAt}`);
      console.log(`Completed: ${batch.completedAt || 'N/A'}`);
    }

    const { data: jobs } = await supabase
      .from('photo_generation_queue')
      .select('*')
      .eq('batchId', batchId)
      .order('createdAt', { ascending: true });

    if (jobs && jobs.length > 0) {
      console.log(`\n📋 Jobs (${jobs.length}):\n`);
      jobs.forEach((job: any) => {
        console.log(`  Job ${job.id}:`);
        console.log(`    Status: ${job.status}`);
        console.log(`    Attempts: ${job.attempts}/${job.maxAttempts}`);
        console.log(`    Retry At: ${job.retryAt || 'N/A'}`);
        console.log(`    Locked By: ${job.lockedBy || 'None'}`);
        console.log(`    Created: ${job.createdAt}`);
        console.log(`    Completed: ${job.completedAt || 'N/A'}`);
        if (job.errorMessage) {
          console.log(`    Error: ${job.errorMessage}`);
        }
        console.log('');
      });
    }

    const { data: photos } = await supabase
      .from('photos')
      .select('id, url, status, createdAt')
      .eq('generationBatchId', batchId)
      .order('createdAt', { ascending: true });

    if (photos && photos.length > 0) {
      console.log(`\n📸 Generated Photos (${photos.length}):\n`);
      photos.forEach((photo: any, index: number) => {
        console.log(`  ${index + 1}. Photo ${photo.id}:`);
        console.log(`     Status: ${photo.status}`);
        console.log(`     URL: ${photo.url}`);
        console.log(`     Created: ${photo.createdAt}`);
        console.log('');
      });
    } else {
      console.log('\n📸 No photos generated yet\n');
    }
  } else {
    // Show overall queue status
    console.log('\n📋 Overall Queue Status:\n');

    const { data: pendingJobs } = await supabase
      .from('photo_generation_queue')
      .select('id, batchId, status, attempts, createdAt')
      .in('status', ['pending', 'rate_limited'])
      .order('createdAt', { ascending: true })
      .limit(10);

    if (pendingJobs && pendingJobs.length > 0) {
      console.log(`Pending Jobs (${pendingJobs.length}):\n`);
      pendingJobs.forEach((job: any) => {
        console.log(`  Job ${job.id} (Batch ${job.batchId}):`);
        console.log(`    Status: ${job.status}`);
        console.log(`    Attempts: ${job.attempts}`);
        console.log(`    Created: ${job.createdAt}`);
        console.log('');
      });
    } else {
      console.log('✅ No pending jobs\n');
    }

    const { data: processingJobs } = await supabase
      .from('photo_generation_queue')
      .select('id, batchId, lockedBy, lockedAt')
      .eq('status', 'processing');

    if (processingJobs && processingJobs.length > 0) {
      console.log(`Processing Jobs (${processingJobs.length}):\n`);
      processingJobs.forEach((job: any) => {
        console.log(`  Job ${job.id} (Batch ${job.batchId}):`);
        console.log(`    Locked By: ${job.lockedBy}`);
        console.log(`    Locked At: ${job.lockedAt}`);
        console.log('');
      });
    }

    const { data: recentBatches } = await supabase
      .from('photo_generation_batches')
      .select('id, status, totalImagesGenerated, createdAt')
      .order('createdAt', { ascending: false })
      .limit(5);

    if (recentBatches && recentBatches.length > 0) {
      console.log(`Recent Batches:\n`);
      recentBatches.forEach((batch: any) => {
        console.log(`  Batch ${batch.id}:`);
        console.log(`    Status: ${batch.status}`);
        console.log(`    Images: ${batch.totalImagesGenerated}`);
        console.log(`    Created: ${batch.createdAt}`);
        console.log('');
      });
    }
  }

  console.log('='.repeat(60));
}

const batchId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
monitorQueue(batchId).catch(console.error);

