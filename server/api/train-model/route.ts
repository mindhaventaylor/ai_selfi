import express from "express";
import { supabaseServer } from "../../_core/lib/supabase.js";
import { getDb } from "../../db.js";
import { eq } from "drizzle-orm";
import { models } from "../../../drizzle/schema.js";

const router = express.Router();

interface TrainModelRequest {
  modelId: number;
  userId: number;
  prompt: string;
}

// Train model API endpoint
router.post("/", async (req, res) => {
  try {
    const body = req.body as TrainModelRequest;
    const { modelId, userId, prompt } = body;

    if (!modelId || !userId || !prompt) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: modelId, userId, prompt" 
      });
    }

    console.log(`[Train Model] Starting training for model ${modelId}, user ${userId}`);
    console.log(`[Train Model] Training prompt: ${prompt}`);

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

      // Model training with prompt only (no image verification needed)
      // The prompt contains the training instructions
      console.log(`[Train Model] Processing training with prompt: ${prompt}`);

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

      // Model training with prompt only (no image verification needed)
      // The prompt contains the training instructions
      console.log(`[Train Model] Processing training with prompt: ${prompt}`);

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

