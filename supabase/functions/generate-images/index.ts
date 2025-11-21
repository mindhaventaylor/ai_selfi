// Supabase Edge Function: Generate Images (Queue-based)
// This function enqueues image generation jobs instead of processing them directly
// A separate worker processes the queue with proper backoff/jitter

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExampleImageInfo {
  id: number;
  url: string;
  prompt: string;
}

interface GenerateImagesRequest {
  batchId: number;
  userId: number;
  modelId: number;
  trainingImageUrls: string[]; // Model's training images
  exampleImages: ExampleImageInfo[]; // Selected example images with prompts
  basePrompt: string; // Base prompt with user options (glasses, hair, etc.)
  aspectRatio: "1:1" | "9:16" | "16:9";
  numImagesPerExample: number; // Usually 4
  glasses: "yes" | "no";
  hairColor?: string;
  hairStyle?: string;
  backgrounds: string[];
  styles: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Supabase provides these automatically, but we can also get from env
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
    
    console.log(`[Generate Images] Environment check:`);
    console.log(`[Generate Images]   - SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`[Generate Images]   - SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: GenerateImagesRequest = await req.json();
    const {
      batchId,
      userId,
      modelId,
      trainingImageUrls,
      exampleImages,
      basePrompt,
      aspectRatio,
      numImagesPerExample,
      glasses,
      hairColor,
      hairStyle,
      backgrounds,
      styles,
    } = body;

    console.log(
      `[Generate Images] Enqueuing batch ${batchId}, ${exampleImages.length} example images, ${numImagesPerExample} images per example`
    );

    // Update batch status to "generating"
    await supabase
      .from("photo_generation_batches")
      .update({ status: "generating" })
      .eq("id", batchId)
      .eq("userId", userId);

    // Filter out example images with localhost URLs
    const validExampleImages = exampleImages.filter(img => {
      const isLocalhost = img.url.includes("localhost") || img.url.includes("127.0.0.1");
      if (isLocalhost) {
        console.warn(
          `[Generate Images] Skipping example image ${img.id} - localhost URL not accessible: ${img.url}`
        );
      }
      return !isLocalhost;
    });

    if (validExampleImages.length === 0) {
      throw new Error("No valid example images available. Please upload example images to Supabase Storage or use public URLs.");
    }

    // Enqueue jobs for each example image
    const queueJobs = validExampleImages.map((exampleImage) => ({
      batchId,
      userId,
      modelId,
      exampleImageId: exampleImage.id,
      exampleImageUrl: exampleImage.url,
      exampleImagePrompt: exampleImage.prompt,
      trainingImageUrls,
      basePrompt,
      aspectRatio,
      numImagesPerExample,
      glasses,
      hairColor: hairColor || null,
      hairStyle: hairStyle || null,
      backgrounds,
      styles,
      status: "pending",
      attempts: 0,
      maxAttempts: 5,
      retryAt: null,
    }));

    // Insert all jobs into the queue
    const { data: jobs, error: queueError } = await supabase
      .from("photo_generation_queue")
      .insert(queueJobs)
      .select();

    if (queueError) {
      console.error(`[Generate Images] Error enqueuing jobs:`, queueError);
      throw new Error(`Failed to enqueue generation jobs: ${queueError.message}`);
    }

    console.log(`[Generate Images] ✅ Successfully enqueued ${jobs?.length || 0} jobs for batch ${batchId}`);

    return new Response(
      JSON.stringify({
        success: true,
        batchId,
        jobsEnqueued: jobs?.length || 0,
        message: "Image generation jobs enqueued. Processing will begin shortly.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 202, // Accepted - processing will happen asynchronously
      }
    );
  } catch (error) {
    console.error(`[Generate Images] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
