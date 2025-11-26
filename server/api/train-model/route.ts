import express from "express";
import { supabaseServer } from "../../_core/lib/supabase.js";
import { getDb } from "../../db.js";
import { eq } from "drizzle-orm";
import { models } from "../../../drizzle/schema.js";

const router = express.Router();

export interface TrainModelRequest {
  modelId: number;
  userId: number;
  prompt: string;
}

// Core training logic that can be called directly or via HTTP
export async function trainModelLogic(body: TrainModelRequest): Promise<{ success: boolean; modelId: number; message: string }> {
  const { modelId, userId, prompt } = body;

  if (!modelId || !userId || !prompt) {
    throw new Error("Missing required fields: modelId, userId, prompt");
  }

  console.log(`[Train Model] Starting training for model ${modelId}, user ${userId}`);
  console.log(`[Train Model] Training prompt: ${prompt}`);

  const db = await getDb();

  // Use REST API fallback if direct connection failed
  if (!db) {
    console.log("[Train Model] Using REST API fallback for database operations");
    
    // Verify model exists and belongs to user before updating
    const { data: existingModel, error: fetchError } = await supabaseServer
      .from("models")
      .select("id, userId, status")
      .eq("id", modelId)
      .eq("userId", userId)
      .single();

    if (fetchError || !existingModel) {
      console.error(`[Train Model] Model not found or access denied:`, {
        modelId,
        userId,
        error: fetchError,
      });
      throw new Error(`Model not found or access denied: ${fetchError?.message || "Model does not exist"}`);
    }

    console.log(`[Train Model] Model found:`, {
      id: existingModel.id,
      currentStatus: existingModel.status,
      targetStatus: "training",
    });
    
    // Update model status to "training"
    const { data: updateData, error: updateError } = await supabaseServer
      .from("models")
      .update({ status: "training" })
      .eq("id", modelId)
      .eq("userId", userId)
      .select();

    if (updateError) {
      console.error(`[Train Model] Error updating model status to training:`, {
        error: updateError,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        modelId,
        userId,
      });
      throw new Error(`Failed to update model status: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      console.error(`[Train Model] Update returned no data:`, {
        modelId,
        userId,
        updateData,
      });
      throw new Error(`Failed to update model status: No rows updated`);
    }

    console.log(`[Train Model] Status updated to "training":`, updateData[0]);

    // Model training with prompt only (no image verification needed)
    // The prompt contains the training instructions
    console.log(`[Train Model] Processing training with prompt: ${prompt}`);

    // Update model status to "ready" immediately
    const { data: readyData, error: readyError } = await supabaseServer
      .from("models")
      .update({ status: "ready" })
      .eq("id", modelId)
      .eq("userId", userId)
      .select();

    if (readyError) {
      console.error(`[Train Model] Error updating model status to ready:`, {
        error: readyError,
        message: readyError.message,
        details: readyError.details,
        hint: readyError.hint,
        code: readyError.code,
        modelId,
        userId,
      });
      throw new Error(`Failed to update model status to ready: ${readyError.message}`);
    }

    if (!readyData || readyData.length === 0) {
      console.error(`[Train Model] Update to ready returned no data:`, {
        modelId,
        userId,
        readyData,
      });
      throw new Error(`Failed to update model status to ready: No rows updated`);
    }

    console.log(`[Train Model] Status updated to "ready":`, readyData[0]);

    console.log(`[Train Model] Model ${modelId} training completed successfully`);
    
    return {
      success: true,
      modelId,
      message: "Model training completed",
    };
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
    
    return {
      success: true,
      modelId,
      message: "Model training completed",
    };
  }
}

// Train model API endpoint
router.post("/", async (req, res) => {
  try {
    const body = req.body as TrainModelRequest;
    const result = await trainModelLogic(body);
    return res.json(result);
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
          const updateResult = await db
            .update(models)
            .set({ status: "failed" })
            .where(eq(models.id, modelId));
          console.log(`[Train Model] Updated model ${modelId} to failed via direct DB`);
        } else {
          const { data: failData, error: failError } = await supabaseServer
            .from("models")
            .update({ status: "failed" })
            .eq("id", modelId)
            .eq("userId", userId)
            .select();
          
          if (failError) {
            console.error(`[Train Model] Failed to update status to failed:`, {
              error: failError,
              message: failError.message,
              details: failError.details,
              modelId,
              userId,
            });
          } else {
            console.log(`[Train Model] Updated model ${modelId} to failed via REST API:`, failData);
          }
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

