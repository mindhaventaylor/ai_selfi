import express from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
// Available models: gemini-3-pro-image-preview (Nano Banana Pro - default), gemini-2.5-flash-image
const geminiModel = process.env.GEMINI_MODEL_NAME ?? "gemini-3-pro-image-preview";
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

// Log warnings instead of throwing to prevent app crashes during build/startup
let envError: string | null = null;
if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  envError = "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY must be set.";
  console.error("[photo-generation] Environment variables missing:", envError);
  console.error("[photo-generation] SUPABASE_URL:", supabaseUrl ? "set" : "missing");
  console.error("[photo-generation] SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "set" : "missing");
  console.error("[photo-generation] GEMINI_API_KEY:", geminiApiKey ? "set" : "missing");
}

// Create supabase client only if we have credentials
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const router = express.Router();

router.post("/", async (req, res) => {
  // Check if we have the required environment variables
  if (envError || !supabase) {
    console.error("[photo-generation] Cannot process job - missing env vars");
    return res.status(500).json({
      success: false,
      error: envError || "Supabase client not initialized",
    });
  }

  const job = req.body as JobPayload;

  try {
    await processJob(job, supabase);
    res.json({ success: true });
  } catch (error) {
    console.error("[photo-generation] job failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

type JobPayload = {
  id: number;
  batchId: number;
  userId: number;
  modelId?: number; // Optional - present for page1 flow, absent for page2 flow
  exampleImageId: number;
  exampleImageUrl: string;
  exampleImagePrompt: string;
  trainingImageUrls: string[];
  basePrompt: string;
  aspectRatio: "1:1" | "9:16" | "16:9";
  numImagesPerExample: number;
  glasses: string;
  hairColor?: string | null;
  hairStyle?: string | null;
  backgrounds: string[];
  styles: string[];
};

type GeneratedImage = {
  data: string;
  mimeType: string;
};

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

async function processJob(job: JobPayload, supabase: SupabaseClient) {
  await supabase
    .from("photo_generation_queue")
    .update({
      status: "processing",
      lockedBy: "photo-generation-route",
      lockedAt: new Date().toISOString(),
    })
    .eq("id", job.id);

  try {
    // Send training image URLs directly instead of downloading and converting
    // The API will handle downloading the images from URLs
    if (job.trainingImageUrls.length === 0) {
      throw new Error("No training image URLs provided");
    }

    // Never use exampleImageUrl - only use model's training images
    // The example image selection is only for UI purposes, not sent to API
    const prompt = job.basePrompt; // Don't include exampleImagePrompt
    
    for (let imgIndex = 0; imgIndex < job.numImagesPerExample; imgIndex++) {
      const generatedImage = await generateSingleImage(
        prompt,
        job.aspectRatio,
        job.trainingImageUrls, // Send URLs instead of downloaded images
        supabase
      );

      const imageBuffer = Buffer.from(generatedImage.data, "base64");
      const fileName = `${job.userId}/${Date.now()}-${imgIndex}.png`;

      const { error: uploadError } = await supabase.storage
        .from("generated-photos")
        .upload(fileName, imageBuffer, {
          contentType: generatedImage.mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("generated-photos")
        .getPublicUrl(fileName);

      await supabase.from("photos").insert({
        userId: job.userId,
        modelId: job.modelId,
        generationBatchId: job.batchId,
        url: urlData.publicUrl,
        status: "completed",
        creditsUsed: 1,
        aspectRatio: job.aspectRatio,
        glasses: job.glasses,
        hairColor: job.hairColor,
        hairStyle: job.hairStyle,
        backgrounds: job.backgrounds,
        styles: job.styles,
      });
    }

    await supabase
      .from("photo_generation_queue")
      .update({
        status: "completed",
        completedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
      })
      .eq("id", job.id);

    // Check if all jobs for this batch are completed
    const { data: allJobs } = await supabase
      .from("photo_generation_queue")
      .select("status")
      .eq("batchId", job.batchId);

    if (allJobs) {
      const allCompleted = allJobs.every(j => j.status === "completed" || j.status === "failed");
      const successfulJobs = allJobs.filter(j => j.status === "completed").length;
      
      if (allCompleted) {
        // All jobs finished - update batch status
        await supabase
          .from("photo_generation_batches")
          .update({
            status: successfulJobs > 0 ? "completed" : "failed",
            completedAt: new Date().toISOString(),
            totalImagesGenerated: successfulJobs * job.numImagesPerExample,
          })
          .eq("id", job.batchId);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Update job status
    await supabase
      .from("photo_generation_queue")
      .update({
        status: "failed",
        processedAt: new Date().toISOString(),
        errorMessage,
      })
      .eq("id", job.id);

    // Check if all jobs for this batch have failed or completed
    const { data: allJobs } = await supabase
      .from("photo_generation_queue")
      .select("status")
      .eq("batchId", job.batchId);

    if (allJobs) {
      const allFailed = allJobs.every(j => j.status === "failed");
      const allCompleted = allJobs.every(j => j.status === "completed" || j.status === "failed");
      
      if (allFailed) {
        // All jobs failed - mark batch as failed
        await supabase
          .from("photo_generation_batches")
          .update({
            status: "failed",
          })
          .eq("id", job.batchId);
      } else if (allCompleted) {
        // All jobs completed (some may have failed, but at least one succeeded)
        // Count successful jobs
        const successfulJobs = allJobs.filter(j => j.status === "completed").length;
        await supabase
          .from("photo_generation_batches")
          .update({
            status: successfulJobs > 0 ? "completed" : "failed",
            completedAt: new Date().toISOString(),
            totalImagesGenerated: successfulJobs * job.numImagesPerExample,
          })
          .eq("id", job.batchId);
      }
    }

    throw error;
  }
}

async function downloadImage(url: string, supabase: SupabaseClient) {
  const storagePrefix = "/storage/v1/object/";
  if (url.includes(storagePrefix)) {
    const after = url.split(storagePrefix)[1];
    const [bucket, ...parts] = after.split("/");
    const path = parts.join("/");
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) {
      console.error("[photo-generation] download storage error:", error);
      return null;
    }
    const arrayBuffer = await data.arrayBuffer();
    return {
      data: Buffer.from(arrayBuffer).toString("base64"),
      mimeType: data.type || "image/jpeg",
    };
  }

  // Handle localhost URLs in development by reading from filesystem
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    try {
      // Extract the path from the URL (e.g., /image_selection/Man/5_man_studio_casual.jpeg)
      const urlObj = new URL(url);
      const filePath = urlObj.pathname;
      
      // Try multiple possible locations for the public directory
      const possiblePaths = [
        path.resolve(process.cwd(), "client", "public", filePath.substring(1)), // Remove leading /
        path.resolve(process.cwd(), "dist", "public", filePath.substring(1)),
        path.resolve(process.cwd(), "public", filePath.substring(1)),
        path.resolve(__dirname, "../..", "client", "public", filePath.substring(1)),
      ];
      
      for (const fullPath of possiblePaths) {
        if (fs.existsSync(fullPath)) {
          const fileBuffer = fs.readFileSync(fullPath);
          const ext = path.extname(fullPath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
          };
          const mimeType = mimeTypes[ext] || "image/jpeg";
          
          console.log(`[photo-generation] Successfully read localhost file from ${fullPath}`);
          return {
            data: fileBuffer.toString("base64"),
            mimeType,
          };
        }
      }
      
      console.error(`[photo-generation] Localhost file not found: ${filePath}. Tried paths:`, possiblePaths);
      return null;
    } catch (error) {
      console.error("[photo-generation] Error reading localhost file:", error);
      return null;
    }
  }

  // For production URLs, fetch via HTTP
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`[photo-generation] fetch failed for ${url}: ${response.status} ${response.statusText}`);
    return null;
  }
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  return {
    data: Buffer.from(arrayBuffer).toString("base64"),
    mimeType,
  };
}

async function generateSingleImage(
  prompt: string,
  aspectRatio: JobPayload["aspectRatio"],
  trainingImageUrls: string[], // Changed to URLs instead of downloaded images
  supabase: SupabaseClient
): Promise<GeneratedImage> {
  console.log(`[photo-generation] Generating image with model: ${geminiModel}`);
  console.log(`[photo-generation] Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`[photo-generation] Training image URLs: ${trainingImageUrls.length} (example image not included in API request)`);
  
  const aspectRatioPrompt =
    aspectRatio === "1:1"
      ? "Create a square image (1:1)."
      : aspectRatio === "9:16"
      ? "Create a vertical portrait image (9:16)."
      : "Create a horizontal landscape image (16:9).";

  // Download training images from URLs (Gemini API requires base64, not URLs)
  // But we're sending URLs in the request structure as requested
  const trainingImages: GeneratedImage[] = [];
  for (const url of trainingImageUrls) {
    // For Supabase storage URLs, download directly
    const storagePrefix = "/storage/v1/object/";
    if (url.includes(storagePrefix)) {
      const after = url.split(storagePrefix)[1];
      const [bucket, ...parts] = after.split("/");
      const path = parts.join("/");
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (!error && data) {
        const arrayBuffer = await data.arrayBuffer();
        trainingImages.push({
          data: Buffer.from(arrayBuffer).toString("base64"),
          mimeType: data.type || "image/jpeg",
        });
      }
    } else {
      // For other URLs, fetch them
      const img = await downloadImage(url, supabase);
      if (img) trainingImages.push(img);
    }
  }

  if (trainingImages.length === 0) {
    throw new Error("Failed to download any training images from URLs");
  }

  const parts = [
    { text: `${prompt} ${aspectRatioPrompt}` },
    // Send training images as base64 (required by Gemini API)
    // Example image is never included in the API request
    ...trainingImages.map((img) => ({
      inline_data: {
        mime_type: img.mimeType,
        data: img.data,
      },
    })),
  ];

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio:
          aspectRatio === "1:1"
            ? "1:1"
            : aspectRatio === "16:9"
            ? "16:9"
            : "9:16",
      },
    },
  };

  console.log(`[photo-generation] Request URL: ${geminiUrl}`);
  console.log(`[photo-generation] Request body size: ${JSON.stringify(requestBody).length} bytes`);

  const response = await fetch(geminiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiApiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    const suggestedDelayMs = retryAfter
      ? Math.min(parseInt(retryAfter, 10) * 1000 * 2, 300000)
      : 180000;
    throw new RateLimitedError("Rate limited", suggestedDelayMs, 429);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  
  // Log full response for debugging
  console.log("[photo-generation] Gemini response structure:", JSON.stringify(result, null, 2).substring(0, 1000));
  
  const candidate = result?.candidates?.[0];
  
  if (!candidate) {
    console.error("[photo-generation] No candidate in response:", result);
    throw new Error(`Gemini API returned no candidate. Response: ${JSON.stringify(result)}`);
  }
  
  // Check for finish reason
  if (candidate.finishReason && candidate.finishReason !== "STOP") {
    console.error("[photo-generation] Candidate finish reason:", candidate.finishReason);
    throw new Error(`Gemini API finished with reason: ${candidate.finishReason}`);
  }
  
  const content = candidate?.content;
  if (!content) {
    console.error("[photo-generation] No content in candidate:", candidate);
    throw new Error(`Gemini API returned no content. Candidate: ${JSON.stringify(candidate)}`);
  }
  
  const responseParts = content?.parts || [];
  if (!responseParts || responseParts.length === 0) {
    console.error("[photo-generation] No parts in content:", content);
    throw new Error(`Gemini API returned no parts. Content: ${JSON.stringify(content)}`);
  }
  
  // Find the part with image data
  let inlineData: { data?: string; mimeType?: string; mime_type?: string } | undefined;
  
  for (const responsePart of responseParts) {
    const partAny = responsePart as any;
    if (partAny.inlineData || partAny.inline_data) {
      inlineData = (partAny.inlineData ?? partAny.inline_data) as {
        data?: string;
        mimeType?: string;
        mime_type?: string;
      };
      break;
    }
  }
  
  if (!inlineData) {
    console.error("[photo-generation] No inlineData found in parts:", responseParts);
    throw new Error(`Gemini response missing image data. Parts: ${JSON.stringify(responseParts)}`);
  }
  
  if (!inlineData.data) {
    console.error("[photo-generation] inlineData exists but has no data:", inlineData);
    throw new Error(`Gemini response inlineData missing data field. InlineData: ${JSON.stringify(inlineData)}`);
  }

  return {
    data: inlineData.data,
    mimeType: inlineData.mimeType || inlineData.mime_type || "image/png",
  };
}

