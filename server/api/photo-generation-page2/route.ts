import express from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
// Available models: gemini-2.5-flash-image (default), gemini-3.0-pro (Nano Banana Pro), gemini-3-pro
const geminiModel = process.env.GEMINI_MODEL_NAME ?? "gemini-2.5-flash-image";
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

// Log warnings instead of throwing to prevent app crashes during build/startup
let envError: string | null = null;
if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  envError = "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY must be set.";
  console.error("[photo-generation-page2] Environment variables missing:", envError);
  console.error("[photo-generation-page2] SUPABASE_URL:", supabaseUrl ? "set" : "missing");
  console.error("[photo-generation-page2] SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "set" : "missing");
  console.error("[photo-generation-page2] GEMINI_API_KEY:", geminiApiKey ? "set" : "missing");
}

// Create supabase client only if we have credentials
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const router = express.Router();

router.post("/", async (req, res) => {
  // Check if we have the required environment variables
  if (envError || !supabase) {
    console.error("[photo-generation-page2] Cannot process job - missing env vars");
    return res.status(500).json({
      success: false,
      error: envError || "Supabase client not initialized",
    });
  }

  const job = req.body as Page2JobPayload;

  try {
    await processPage2Job(job, supabase);
    res.json({ success: true });
  } catch (error) {
    console.error("[photo-generation-page2] job failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

type Page2JobPayload = {
  id: number;
  batchId: number;
  userId: number;
  exampleImageId?: number | null;
  exampleImageUrl: string;
  exampleImagePrompt?: string | null;
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

export async function processPage2Job(job: Page2JobPayload, supabase: SupabaseClient) {
  console.log(`[photo-generation-page2] Processing job ${job.id} for batch ${job.batchId}`);

  // Update job status to processing
  const { error: updateError } = await supabase
    .from("page2_generation_queue")
    .update({ status: "processing" })
    .eq("id", job.id);

  if (updateError) {
    console.error(`[photo-generation-page2] Failed to update job status:`, updateError);
  }

  try {
    // Generate images using Gemini
    const generatedImages = await generateImagesWithGemini(
      job.trainingImageUrls, // User's uploaded images
      [job.exampleImageUrl], // Example image
      job.basePrompt,
      job.aspectRatio,
      job.numImagesPerExample,
      job.glasses,
      job.hairColor,
      job.hairStyle,
      job.backgrounds,
      job.styles
    );

    console.log(`[photo-generation-page2] Generated ${generatedImages.length} images for job ${job.id}`);

    // Upload generated images to Supabase Storage and create photo records immediately
    const uploadedUrls: string[] = [];
    for (let i = 0; i < generatedImages.length; i++) {
      const image = generatedImages[i];
      const fileName = `page2-batch-${job.batchId}-job-${job.id}-image-${i + 1}-${Date.now()}.png`;
      
      console.log(`[photo-generation-page2] Generated image ${i + 1}/${generatedImages.length} for job ${job.id}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("generated-photos")
        .upload(fileName, image, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error(`[photo-generation-page2] Failed to upload image ${i + 1}:`, uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("generated-photos")
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
        
        // Create photo record immediately and update batch totalImagesGenerated
        const { error: photoError } = await supabase.from("photos").insert({
          userId: job.userId,
          modelId: null, // No model for page2
          page2GenerationBatchId: job.batchId, // Link to page2 batch
          url: urlData.publicUrl,
          status: "completed",
          creditsUsed: 1,
          aspectRatio: job.aspectRatio,
          glasses: job.glasses,
          hairColor: job.hairColor || null,
          hairStyle: job.hairStyle || null,
          backgrounds: job.backgrounds,
          styles: job.styles,
        });

        if (photoError) {
          console.error(`[photo-generation-page2] Failed to create photo record:`, photoError);
        } else {
          // Update batch totalImagesGenerated immediately after each image
          const { data: currentBatch } = await supabase
            .from("page2_generation_batches")
            .select("totalImagesGenerated")
            .eq("id", job.batchId)
            .single();
          
          if (currentBatch) {
            await supabase
              .from("page2_generation_batches")
              .update({
                totalImagesGenerated: (currentBatch.totalImagesGenerated || 0) + 1,
              })
              .eq("id", job.batchId);
            
            console.log(`[photo-generation-page2] Updated batch ${job.batchId} totalImagesGenerated to ${(currentBatch.totalImagesGenerated || 0) + 1}`);
          }
        }
      }
    }

    // Update job status to completed
    const { error: completeError } = await supabase
      .from("page2_generation_queue")
      .update({
        status: "completed",
        generatedImageUrl: uploadedUrls[0] || null, // Store first image URL
        completedAt: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (completeError) {
      console.error(`[photo-generation-page2] Failed to update job completion:`, completeError);
    }

    // Update batch status
    await updatePage2BatchStatus(job.batchId, uploadedUrls.length, supabase);

    console.log(`[photo-generation-page2] ✅ Job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`[photo-generation-page2] Job ${job.id} failed:`, error);

    // Update job status to failed
    const { error: failError } = await supabase
      .from("page2_generation_queue")
      .update({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        completedAt: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (failError) {
      console.error(`[photo-generation-page2] Failed to update job failure:`, failError);
    }

    // Update batch status if needed
    await updatePage2BatchStatus(job.batchId, 0, supabase);

    throw error;
  }
}

async function updatePage2BatchStatus(
  batchId: number,
  imagesGenerated: number,
  supabase: SupabaseClient
) {
  // Get all jobs for this batch
  const { data: jobs, error: jobsError } = await supabase
    .from("page2_generation_queue")
    .select("status")
    .eq("batchId", batchId);

  if (jobsError) {
    console.error(`[photo-generation-page2] Failed to fetch jobs:`, jobsError);
    return;
  }

  const allCompleted = jobs.every((job) => job.status === "completed");
  const allFailed = jobs.every((job) => job.status === "failed");
  const hasCompleted = jobs.some((job) => job.status === "completed");

  // Get current batch
  const { data: batch, error: batchError } = await supabase
    .from("page2_generation_batches")
    .select("*")
    .eq("id", batchId)
    .single();

  if (batchError) {
    console.error(`[photo-generation-page2] Failed to fetch batch:`, batchError);
    return;
  }

  // Update total images generated
  const newTotal = (batch.totalImagesGenerated || 0) + imagesGenerated;

  let newStatus = batch.status;
  if (allFailed) {
    newStatus = "failed";
  } else if (allCompleted) {
    newStatus = "completed";
  } else if (hasCompleted) {
    newStatus = "generating"; // Still processing
  }

  const { error: updateError } = await supabase
    .from("page2_generation_batches")
    .update({
      totalImagesGenerated: newTotal,
      status: newStatus,
      completedAt: newStatus === "completed" || newStatus === "failed" 
        ? new Date().toISOString() 
        : null,
    })
    .eq("id", batchId);

  if (updateError) {
    console.error(`[photo-generation-page2] Failed to update batch:`, updateError);
  } else {
    console.log(`[photo-generation-page2] Updated batch ${batchId}: status=${newStatus}, total=${newTotal}`);
  }
}

async function generateImagesWithGemini(
  trainingImageUrls: string[],
  exampleImageUrls: string[],
  basePrompt: string,
  aspectRatio: "1:1" | "9:16" | "16:9",
  numImages: number,
  glasses: string,
  hairColor?: string | null,
  hairStyle?: string | null,
  backgrounds?: string[],
  styles?: string[]
): Promise<Buffer[]> {
  // Download training images
  const trainingImages: Buffer[] = [];
  for (const url of trainingImageUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to download: ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      trainingImages.push(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error(`[photo-generation-page2] Failed to download training image ${url}:`, error);
      throw error;
    }
  }

  // Download example images
  const exampleImages: Buffer[] = [];
  for (const url of exampleImageUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to download: ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      exampleImages.push(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error(`[photo-generation-page2] Failed to download example image ${url}:`, error);
      throw error;
    }
  }

  // Build prompt
  let prompt = basePrompt;
  if (hairColor && hairColor !== "default") {
    prompt += ` Hair color: ${hairColor}.`;
  }
  if (hairStyle && hairStyle !== "no-preference") {
    prompt += ` Hair style: ${hairStyle}.`;
  }
  if (glasses === "yes") {
    prompt += ` Include glasses.`;
  }
  if (backgrounds && backgrounds.length > 0) {
    prompt += ` Background: ${backgrounds.join(", ")}.`;
  }
  if (styles && styles.length > 0) {
    prompt += ` Style: ${styles.join(", ")}.`;
  }

  // Generate images
  const generatedImages: Buffer[] = [];
  
  for (let i = 0; i < numImages; i++) {
    try {
      // Prepare parts for Gemini API
      const parts: any[] = [
        {
          text: prompt,
        },
      ];

      // Add training images
      for (const img of trainingImages) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: img.toString("base64"),
          },
        });
      }

      // Add example images
      for (const img of exampleImages) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: img.toString("base64"),
          },
        });
      }

      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: parts,
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseModalities: ["IMAGE"],
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Extract image from response
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("Gemini response missing candidates");
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts) {
        throw new Error("Gemini response missing content parts");
      }

      const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
      if (!imagePart || !imagePart.inlineData) {
        throw new Error("Gemini response missing image data");
      }

      const imageData = imagePart.inlineData.data;
      const imageBuffer = Buffer.from(imageData, "base64");
      generatedImages.push(imageBuffer);

      console.log(`[photo-generation-page2] Generated image ${i + 1}/${numImages}`);
    } catch (error) {
      console.error(`[photo-generation-page2] Failed to generate image ${i + 1}:`, error);
      throw error;
    }
  }

  return generatedImages;
}

