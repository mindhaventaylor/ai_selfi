import express from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json({ limit: "20mb" }));

const PORT = Number(process.env.PHOTO_API_PORT ?? 4001);
const SERVICE_NAME = "local-photo-webhook";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
const geminiModel = process.env.GEMINI_MODEL_NAME ?? "gemini-2.5-flash-image";

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  throw new Error(
    "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY must be set."
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});

app.post("/webhook/photo-generation", async (req, res) => {
  const job = req.body as JobPayload;

  try {
    console.log(`[Webhook] received job ${job.id} for batch ${job.batchId}`);
    await processJob(job, supabase);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Webhook] Processing failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Webhook] Listening on http://localhost:${PORT}`);
});

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

async function processJob(
  job: JobPayload,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from("photo_generation_queue")
    .update({
      status: "processing",
      lockedBy: SERVICE_NAME,
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
      console.log(`[Webhook] Generating image ${imgIndex + 1}`);
      const generatedImage = await generateSingleImage(
        prompt,
        job.aspectRatio,
        trainingImages,
        exampleImage
      );

      const fileName = `${job.userId}/${Date.now()}-${imgIndex}.png`;
      const imageBuffer = Buffer.from(generatedImage.data, "base64");

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

    await supabase.from("photo_generation_queue").update({
      status: "completed",
      completedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    }).eq("id", job.id);

    console.log(`[Webhook] Job ${job.id} completed`);
  } catch (error) {
    await supabase
      .from("photo_generation_queue")
      .update({
        status: "failed",
        processedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .eq("id", job.id);
    throw error;
  }
}

async function downloadImage(url: string, supabase: SupabaseClient) {
  const storagePrefix = "/storage/v1/object/";
  if (url.includes(storagePrefix)) {
    const after = url.split(storagePrefix)[1];
    const [bucket, ...pathParts] = after.split("/");
    const path = pathParts.join("/");

    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) {
      console.error("[Webhook] Error downloading from storage:", error);
      return null;
    }
    const arrayBuffer = await data.arrayBuffer();
    return {
      mimeType: data.type || "image/jpeg",
      data: Buffer.from(arrayBuffer).toString("base64"),
    };
  }

  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    console.error("[Webhook] Skipping localhost URL:", url);
    return null;
  }

  const response = await fetch(url);
  if (!response.ok) {
    console.error("[Webhook] Failed to fetch image", response.status);
    return null;
  }
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  return {
    mimeType,
    data: Buffer.from(arrayBuffer).toString("base64"),
  };
}

async function generateSingleImage(
  prompt: string,
  aspectRatio: JobPayload["aspectRatio"],
  trainingImages: GeneratedImage[],
  exampleImage: GeneratedImage
): Promise<GeneratedImage> {
  const aspectRatioPrompt =
    aspectRatio === "1:1"
      ? "Create a square image (1:1)."
      : aspectRatio === "9:16"
      ? "Create a vertical portrait image (9:16)."
      : "Create a horizontal landscape image (16:9).";

  const parts = [
    { text: prompt + " " + aspectRatioPrompt },
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

  const response = await fetch(geminiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          aspectRatio:
            aspectRatio === "1:1" ? "1:1" : aspectRatio === "16:9" ? "16:9" : "9:16",
        },
      },
    }),
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
  const candidate = result?.candidates?.[0];
  const part = candidate?.content?.parts?.[0];
  const inlineData =
    part?.inlineData ?? part?.inline_data ?? undefined;

  if (!inlineData?.data) {
    throw new Error("Gemini response missing image data");
  }

  return {
    data: inlineData.data,
    mimeType: inlineData.mimeType || inlineData.mime_type || "image/png",
  };
}

