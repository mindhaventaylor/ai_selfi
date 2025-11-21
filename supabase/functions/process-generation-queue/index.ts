// Worker: Process Photo Generation Queue
// This worker processes jobs from photo_generation_queue with proper backoff/jitter
// Can run in Cloud Run, VM, or as a scheduled Edge Function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WORKER_ID = Deno.env.get("WORKER_ID") || `worker-${Date.now()}`;
const POLL_INTERVAL_MS = 5000; // 5 seconds between polls when no jobs
const MAX_CONCURRENT_JOBS = 1; // Process one job at a time to avoid rate limits
const LOCK_TIMEOUT_MS = 300000; // 5 minutes - jobs locked longer than this are considered stale

interface QueueJob {
  id: number;
  batchId: number;
  userId: number;
  modelId: number;
  exampleImageId: number;
  exampleImageUrl: string;
  exampleImagePrompt: string;
  trainingImageUrls: string[];
  basePrompt: string;
  aspectRatio: "1:1" | "9:16" | "16:9";
  numImagesPerExample: number;
  glasses: string;
  hairColor?: string;
  hairStyle?: string;
  backgrounds: string[];
  styles: string[];
  attempts: number;
  maxAttempts: number;
  retryAt: string | null;
}

interface GeneratedImage {
  data: string; // base64
  mimeType: string;
}

class RateLimitedError extends Error {
  suggestedDelayMs: number;
  responseStatus: number;

  constructor(message: string, suggestedDelayMs: number, responseStatus: number) {
    super(message);
    this.name = "RateLimitedError";
    this.suggestedDelayMs = suggestedDelayMs;
    this.responseStatus = responseStatus;
  }
}

// Helper: Sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: Download image from URL
async function downloadImage(
  url: string,
  supabase: any
): Promise<{ data: string; mimeType: string } | null> {
  const storageIndex = url.indexOf("/storage/v1/object/");
  if (storageIndex !== -1) {
    const afterStorage = url.substring(storageIndex + "/storage/v1/object/".length);
    const parts = afterStorage.split("/");
    const bucket = parts[0];
    const path = parts.slice(1).join("/");

    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) {
      console.error(`[Worker] Error downloading from storage:`, error);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return {
      data: base64,
      mimeType: data.type || "image/jpeg",
    };
  }

  // External URL
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    console.error(`[Worker] Cannot fetch localhost URL: ${url}`);
    return null;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Worker] Failed to fetch image: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return { data: base64, mimeType: contentType };
  } catch (error) {
    console.error(`[Worker] Error fetching image:`, error);
    return null;
  }
}

// Generate single image using Gemini API
async function generateSingleImage(
  geminiUrl: string,
  geminiApiKey: string,
  trainingImages: Array<{ data: string; mimeType: string }>,
  exampleImage: { data: string; mimeType: string },
  prompt: string,
  aspectRatio: "1:1" | "9:16" | "16:9"
): Promise<GeneratedImage> {
  const aspectRatioPrompt =
    aspectRatio === "1:1"
      ? " Create a square image (1:1 aspect ratio)."
      : aspectRatio === "9:16"
      ? " Create a vertical portrait image (9:16 aspect ratio)."
      : " Create a horizontal landscape image (16:9 aspect ratio).";

  const parts = [
    { text: prompt + aspectRatioPrompt },
    ...trainingImages.map((img) => ({
      inline_data: {
        mime_type: img.mimeType,
        data: img.data,
      },
    })),
    {
      inline_data: {
        mime_type: exampleImage.mimeType,
        data: exampleImage.data,
      },
    },
  ];

  const geminiRequest = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: {
        aspectRatio:
          aspectRatio === "1:1" ? "1:1" : aspectRatio === "16:9" ? "16:9" : "9:16",
      },
    },
  };

  const response = await fetch(geminiUrl, {
    method: "POST",
    headers: {
      "x-goog-api-key": geminiApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(geminiRequest),
  });

  if (response.status === 429) {
    // Parse retry info from response
    let suggestedDelayMs = 180000; // Default 3 minutes

    try {
      const errorText = await response.text();
      const errorJson = JSON.parse(errorText || "{}");
      const retryInfo = errorJson.error?.details?.find(
        (d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
      );
      if (retryInfo?.retryDelay) {
        const m = String(retryInfo.retryDelay).match(/(\d+\.?\d*)/);
        if (m) {
          suggestedDelayMs = Math.min(parseFloat(m[1]) * 1000 * 1.5, 300000); // 1.5x buffer, max 5 min
        }
      }
    } catch (_) {}

    const retryAfterHeader = response.headers.get("retry-after");
    if (retryAfterHeader) {
      const parsed = parseInt(retryAfterHeader);
      if (!Number.isNaN(parsed)) {
        suggestedDelayMs = Math.min(parsed * 1000 * 2, 300000); // 2x buffer
      }
    }

    throw new RateLimitedError(
      "Rate limited (429)",
      suggestedDelayMs,
      429
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();

  // Check for inlineData (camelCase) or inline_data (snake_case)
  if (result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
    const imageData = result.candidates[0].content.parts[0].inlineData;
    return {
      data: imageData.data,
      mimeType: imageData.mimeType || "image/png",
    };
  }

  if (result.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data) {
    const imageData = result.candidates[0].content.parts[0].inline_data;
    return {
      data: imageData.data,
      mimeType: imageData.mime_type || "image/png",
    };
  }

  throw new Error("Invalid response from Gemini API - no image data found");
}

// Process a single job
async function processJob(
  job: QueueJob,
  supabase: any,
  geminiUrl: string,
  geminiApiKey: string
): Promise<void> {
  console.log(`[Worker ${WORKER_ID}] Processing job ${job.id} (batch ${job.batchId}, example ${job.exampleImageId}, attempt ${job.attempts + 1}/${job.maxAttempts})`);

  try {
    // Download training images
    const trainingImages: Array<{ data: string; mimeType: string }> = [];
    for (const url of job.trainingImageUrls) {
      const img = await downloadImage(url, supabase);
      if (img) trainingImages.push(img);
    }

    if (trainingImages.length === 0) {
      throw new Error("Failed to download any training images");
    }

    // Download example image
    const exampleImage = await downloadImage(job.exampleImageUrl, supabase);
    if (!exampleImage) {
      throw new Error("Failed to download example image");
    }

    // Build prompt
    const prompt = `${job.basePrompt}. ${job.exampleImagePrompt}`;

    // Generate images one by one with delays
    const generatedImages: GeneratedImage[] = [];

    for (let imgIndex = 0; imgIndex < job.numImagesPerExample; imgIndex++) {
      try {
        console.log(
          `[Worker ${WORKER_ID}] Generating image ${imgIndex + 1}/${job.numImagesPerExample} for job ${job.id}...`
        );

        const generatedImage = await generateSingleImage(
          geminiUrl,
          geminiApiKey,
          trainingImages,
          exampleImage,
          prompt,
          job.aspectRatio
        );

        generatedImages.push(generatedImage);

        // Upload to storage
        const imageBuffer = Uint8Array.from(
          atob(generatedImage.data),
          (c) => c.charCodeAt(0)
        );

        const timestamp = Date.now();
        const fileName = `${job.userId}/${timestamp}-${imgIndex}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("generated-photos")
          .upload(fileName, imageBuffer, {
            contentType: generatedImage.mimeType,
            upsert: false,
          });

        if (uploadError) {
          console.error(`[Worker ${WORKER_ID}] Upload error:`, uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("generated-photos")
          .getPublicUrl(fileName);

        // Create photo record
        await supabase.from("photos").insert({
          userId: job.userId,
          modelId: job.modelId,
          generationBatchId: job.batchId,
          url: urlData.publicUrl,
          status: "completed",
          creditsUsed: 1, // Assuming 1 credit per image
          aspectRatio: job.aspectRatio,
          glasses: job.glasses,
          hairColor: job.hairColor,
          hairStyle: job.hairStyle,
          backgrounds: job.backgrounds,
          styles: job.styles,
        });

        console.log(`[Worker ${WORKER_ID}] ✅ Generated and saved image ${imgIndex + 1}/${job.numImagesPerExample}`);

        // Delay between images (5 minutes to avoid rate limits)
        if (imgIndex < job.numImagesPerExample - 1) {
          const delay = 300000; // 5 minutes
          console.log(`[Worker ${WORKER_ID}] Waiting ${Math.round(delay / 1000)}s before next image...`);
          await sleep(delay);
        }
      } catch (error) {
        if (error instanceof RateLimitedError) {
          // Re-throw to be handled by retry logic
          throw error;
        }
        console.error(`[Worker ${WORKER_ID}] Error generating image ${imgIndex + 1}:`, error);
        // Continue with next image
      }
    }

    // Mark job as completed
    await supabase
      .from("photo_generation_queue")
      .update({
        status: "completed",
        completedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
      })
      .eq("id", job.id);

    console.log(`[Worker ${WORKER_ID}] ✅ Job ${job.id} completed successfully`);

    // Update batch progress
    const { data: batchData } = await supabase
      .from("photo_generation_batches")
      .select("id")
      .eq("id", job.batchId)
      .single();

    if (batchData) {
      // Check if all jobs for this batch are completed
      const { data: remainingJobs } = await supabase
        .from("photo_generation_queue")
        .select("id")
        .eq("batchId", job.batchId)
        .in("status", ["pending", "processing", "rate_limited"]);

      if (!remainingJobs || remainingJobs.length === 0) {
        // All jobs completed
        await supabase
          .from("photo_generation_batches")
          .update({
            status: "completed",
            completedAt: new Date().toISOString(),
          })
          .eq("id", job.batchId);
      }
    }
  } catch (error) {
    if (error instanceof RateLimitedError) {
      // Handle rate limiting
      const nextAttempt = job.attempts + 1;
      const retryAt = new Date(Date.now() + error.suggestedDelayMs);

      if (nextAttempt >= job.maxAttempts) {
        // Max attempts reached
        await supabase
          .from("photo_generation_queue")
          .update({
            status: "failed",
            errorMessage: `Rate limited after ${job.maxAttempts} attempts`,
            processedAt: new Date().toISOString(),
          })
          .eq("id", job.id);
      } else {
        // Schedule retry
        await supabase
          .from("photo_generation_queue")
          .update({
            status: "rate_limited",
            attempts: nextAttempt,
            retryAt: retryAt.toISOString(),
            lockedBy: null,
            lockedAt: null,
            errorMessage: `Rate limited, retrying at ${retryAt.toISOString()}`,
          })
          .eq("id", job.id);

        console.log(
          `[Worker ${WORKER_ID}] ⏸️  Job ${job.id} rate limited. Will retry at ${retryAt.toISOString()} (attempt ${nextAttempt}/${job.maxAttempts})`
        );
      }
    } else {
      // Other error
      const nextAttempt = job.attempts + 1;
      if (nextAttempt >= job.maxAttempts) {
        await supabase
          .from("photo_generation_queue")
          .update({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : String(error),
            processedAt: new Date().toISOString(),
          })
          .eq("id", job.id);
      } else {
        // Exponential backoff for other errors
        const backoffMs = Math.min(30000 * nextAttempt, 180000); // 30s, 60s, 90s, 120s, 150s
        const retryAt = new Date(Date.now() + backoffMs);

        await supabase
          .from("photo_generation_queue")
          .update({
            status: "pending",
            attempts: nextAttempt,
            retryAt: retryAt.toISOString(),
            lockedBy: null,
            lockedAt: null,
            errorMessage: `Error: ${error instanceof Error ? error.message : String(error)}. Retrying at ${retryAt.toISOString()}`,
          })
          .eq("id", job.id);
      }
    }
    throw error; // Re-throw to be handled by caller
  }
}

// Get next pending job with locking
async function getNextJob(supabase: any): Promise<QueueJob | null> {
  // Release stale locks (older than LOCK_TIMEOUT_MS)
  const staleLockThreshold = new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString();
  await supabase
    .from("photo_generation_queue")
    .update({
      lockedBy: null,
      lockedAt: null,
      status: "pending",
    })
    .in("status", ["processing"])
    .lt("lockedAt", staleLockThreshold);

  // Get next job (pending or rate_limited with retryAt in the past)
  const now = new Date().toISOString();
  const { data: jobs, error } = await supabase
    .from("photo_generation_queue")
    .select("*")
    .or(`status.eq.pending,and(status.eq.rate_limited,retryAt.lte.${now})`)
    .order("createdAt", { ascending: true })
    .limit(1);

  if (error || !jobs || jobs.length === 0) {
    return null;
  }

  const job = jobs[0] as QueueJob;

  // Try to lock the job
  const { data: lockedJob, error: lockError } = await supabase
    .from("photo_generation_queue")
    .update({
      status: "processing",
      lockedBy: WORKER_ID,
      lockedAt: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("lockedBy", null) // Only lock if not already locked
    .select()
    .single();

  if (lockError || !lockedJob) {
    // Job was locked by another worker
    return null;
  }

  return lockedJob as QueueJob;
}

// Main worker loop
async function runWorker() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "AIzaSyA-7_0RKEYOcDRkwBuVlJTWQycGh5tW8K8";
  const geminiModel = Deno.env.get("GEMINI_MODEL_NAME") || "gemini-2.5-flash-image";
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`[Worker ${WORKER_ID}] Starting worker loop...`);

  while (true) {
    try {
      const job = await getNextJob(supabase);

      if (!job) {
        // No jobs available, wait before polling again
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      // Process the job
      await processJob(job, supabase, geminiUrl, geminiApiKey);
    } catch (error) {
      console.error(`[Worker ${WORKER_ID}] Error in worker loop:`, error);
      await sleep(5000); // Wait before retrying
    }
  }
}

// Run worker if executed directly
if (import.meta.main) {
  runWorker().catch(console.error);
}

