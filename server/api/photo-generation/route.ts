import express from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
const geminiModel = process.env.GEMINI_MODEL_NAME ?? "gemini-2.5-flash-image";
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  throw new Error(
    "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY must be set."
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const router = express.Router();

router.post("/", async (req, res) => {
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
  modelId: number;
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
    const trainingImages = [];
    for (const url of job.trainingImageUrls) {
      const img = await downloadImage(url, supabase);
      if (img) trainingImages.push(img);
    }
    if (trainingImages.length === 0) {
      throw new Error("Failed to download any training images");
    }

    const exampleImage = await downloadImage(job.exampleImageUrl, supabase);
    if (!exampleImage) {
      throw new Error("Failed to download example image");
    }

    const prompt = `${job.basePrompt}. ${job.exampleImagePrompt}`;
    for (let imgIndex = 0; imgIndex < job.numImagesPerExample; imgIndex++) {
      const generatedImage = await generateSingleImage(
        prompt,
        job.aspectRatio,
        trainingImages,
        exampleImage
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

  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    console.error("[photo-generation] skipping localhost URL", url);
    return null;
  }

  const response = await fetch(url);
  if (!response.ok) {
    console.error("[photo-generation] fetch failed", response.status);
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
  trainingImages: GeneratedImage[],
  exampleImage: GeneratedImage
): Promise<GeneratedImage> {
  console.log(`[photo-generation] Generating image with model: ${geminiModel}`);
  console.log(`[photo-generation] Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`[photo-generation] Training images: ${trainingImages.length}, Example image: 1`);
  
  const aspectRatioPrompt =
    aspectRatio === "1:1"
      ? "Create a square image (1:1)."
      : aspectRatio === "9:16"
      ? "Create a vertical portrait image (9:16)."
      : "Create a horizontal landscape image (16:9).";

  const parts = [
    { text: `${prompt} ${aspectRatioPrompt}` },
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

