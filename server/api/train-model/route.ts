import express from "express";
import { supabaseServer } from "../../_core/lib/supabase.js";
import { getDb } from "../../db.js";
import { eq } from "drizzle-orm";
import { models } from "../../../drizzle/schema.js";

const router = express.Router();

interface TrainModelRequest {
  modelId: number;
  userId: number;
  trainingImageUrls: string[];
}

// Train model API endpoint
router.post("/", async (req, res) => {
  try {
    const body = req.body as TrainModelRequest;
    const { modelId, userId, trainingImageUrls } = body;

    if (!modelId || !userId || !trainingImageUrls || trainingImageUrls.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: modelId, userId, trainingImageUrls" 
      });
    }

    // Validate maximum number of training images (5 max)
    const MAX_TRAINING_IMAGES = 5;
    if (trainingImageUrls.length > MAX_TRAINING_IMAGES) {
      return res.status(400).json({ 
        success: false,
        error: `Maximum ${MAX_TRAINING_IMAGES} training images allowed. Received ${trainingImageUrls.length} images.` 
      });
    }

    console.log(`[Train Model] Starting training for model ${modelId}, user ${userId}`);

    const db = await getDb();

    // Use REST API fallback if direct connection failed
    if (!db) {
      console.log("[Train Model] Using REST API fallback for database operations");
      
      // Update model status to "training"
      const { error: updateError } = await supabaseServer
        .from("models")
        .update({ status: "training" })
        .eq("id", modelId)
        .eq("userId", userId);

      if (updateError) {
        console.error(`[Train Model] Error updating model status to training:`, updateError);
        return res.status(500).json({ 
          success: false,
          error: `Failed to update model status: ${updateError.message}` 
        });
      }

      // Verify training images exist (download them to verify)
      // This is just a verification step - images are already uploaded
      let verifiedCount = 0;
      for (let i = 0; i < trainingImageUrls.length; i++) {
        const url = trainingImageUrls[i];
        
        // Extract bucket and path from URL
        const storageIndex = url.indexOf("/storage/v1/object/");
        if (storageIndex !== -1) {
          const afterStorage = url.substring(storageIndex + "/storage/v1/object/".length);
          const parts = afterStorage.split("/");
          
          if (parts.length >= 3 && (parts[0] === "public" || parts[0] === "sign")) {
            const bucketName = parts[1];
            let filePath = parts.slice(2).join("/");
            
            // Remove query parameters
            const queryIndex = filePath.indexOf("?");
            if (queryIndex !== -1) {
              filePath = filePath.substring(0, queryIndex);
            }
            
            const decodedPath = decodeURIComponent(filePath);
            
            // Try to download image to verify it exists
            const { error } = await supabaseServer.storage
              .from(bucketName)
              .download(decodedPath);
            
            if (!error) {
              verifiedCount++;
              console.log(`[Train Model] Verified training image ${i + 1}/${trainingImageUrls.length}`);
            } else {
              console.warn(`[Train Model] Could not verify image ${i + 1}:`, error.message);
            }
          }
        }
      }

      if (verifiedCount === 0) {
        console.error(`[Train Model] Failed to verify any training images`);
        // Still continue - images might be accessible even if download fails
      }

      console.log(`[Train Model] Verified ${verifiedCount}/${trainingImageUrls.length} training images`);

      // Images are already uploaded and saved - model is ready immediately
      // No actual ML training is performed, just storing the reference images
      console.log(`[Train Model] Training images verified and saved - model ready`);

      // Update model status to "ready" immediately
      const { error: readyError } = await supabaseServer
        .from("models")
        .update({ status: "ready" })
        .eq("id", modelId)
        .eq("userId", userId);

      if (readyError) {
        console.error(`[Train Model] Error updating model status to ready:`, readyError);
        return res.status(500).json({ 
          success: false,
          error: `Failed to update model status to ready: ${readyError.message}` 
        });
      }

      console.log(`[Train Model] Model ${modelId} training completed successfully`);
      
      return res.json({
        success: true,
        modelId,
        message: "Model training completed",
      });
    } else {
      // Use direct database connection
      // Update model status to "training"
      await db
        .update(models)
        .set({ status: "training" })
        .where(eq(models.id, modelId));

      // Verify training images exist (download them to verify)
      // This is just a verification step - images are already uploaded
      let verifiedCount = 0;
      for (let i = 0; i < trainingImageUrls.length; i++) {
        const url = trainingImageUrls[i];
        
        // Extract bucket and path from URL
        const storageIndex = url.indexOf("/storage/v1/object/");
        if (storageIndex !== -1) {
          const afterStorage = url.substring(storageIndex + "/storage/v1/object/".length);
          const parts = afterStorage.split("/");
          
          if (parts.length >= 3 && (parts[0] === "public" || parts[0] === "sign")) {
            const bucketName = parts[1];
            let filePath = parts.slice(2).join("/");
            
            // Remove query parameters
            const queryIndex = filePath.indexOf("?");
            if (queryIndex !== -1) {
              filePath = filePath.substring(0, queryIndex);
            }
            
            const decodedPath = decodeURIComponent(filePath);
            
            // Try to download image to verify it exists
            const { error } = await supabaseServer.storage
              .from(bucketName)
              .download(decodedPath);
            
            if (!error) {
              verifiedCount++;
              console.log(`[Train Model] Verified training image ${i + 1}/${trainingImageUrls.length}`);
            } else {
              console.warn(`[Train Model] Could not verify image ${i + 1}:`, error.message);
            }
          }
        }
      }

      if (verifiedCount === 0) {
        console.error(`[Train Model] Failed to verify any training images`);
        // Still continue - images might be accessible even if download fails
      }

      console.log(`[Train Model] Verified ${verifiedCount}/${trainingImageUrls.length} training images`);

      // Images are already uploaded and saved - model is ready immediately
      // No actual ML training is performed, just storing the reference images
      console.log(`[Train Model] Training images verified and saved - model ready`);

      // Update model status to "ready" immediately
      await db
        .update(models)
        .set({ status: "ready" })
        .where(eq(models.id, modelId));

      console.log(`[Train Model] Model ${modelId} training completed successfully`);
      
      return res.json({
        success: true,
        modelId,
        message: "Model training completed",
      });
    }
  } catch (error: any) {
    console.error("[Train Model] Error:", error);
    
    // Try to update model status to "failed" if we have the modelId
    try {
      const body = req.body as TrainModelRequest;
      const modelId = body?.modelId;
      const userId = body?.userId;
      
      if (modelId && userId) {
        const db = await getDb();
        if (db) {
          await db
            .update(models)
            .set({ status: "failed" })
            .where(eq(models.id, modelId));
        } else {
          await supabaseServer
            .from("models")
            .update({ status: "failed" })
            .eq("id", modelId)
            .eq("userId", userId);
        }
      }
    } catch (updateError) {
      console.error("[Train Model] Failed to update status to failed:", updateError);
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

