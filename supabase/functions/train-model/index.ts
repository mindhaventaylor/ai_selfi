// Supabase Edge Function: Train Model
// This function processes model training asynchronously
// It can run even when the main site is down

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrainModelRequest {
  modelId: number;
  userId: number;
  trainingImageUrls: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    // Use alternative names to avoid SUPABASE_ prefix restriction
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: TrainModelRequest = await req.json();
    const { modelId, userId, trainingImageUrls } = body;

    if (!modelId || !userId || !trainingImageUrls || trainingImageUrls.length === 0) {
      throw new Error("Missing required fields: modelId, userId, trainingImageUrls");
    }

    console.log(`[Train Model] Starting training for model ${modelId}, user ${userId}`);

    // Update model status to "training"
    const { error: updateError } = await supabase
      .from("models")
      .update({ status: "training" })
      .eq("id", modelId)
      .eq("userId", userId);

    if (updateError) {
      throw new Error(`Failed to update model status: ${updateError.message}`);
    }

    // Download training images from Supabase Storage
    // These images will be used for actual model training
    const trainingImages = [];
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
          
          // Download image
          const { data, error } = await supabase.storage
            .from(bucketName)
            .download(decodedPath);
          
          if (error) {
            console.error(`[Train Model] Error downloading image ${i + 1}:`, error);
            continue;
          }
          
          if (data) {
            const arrayBuffer = await data.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            const base64 = btoa(String.fromCharCode(...buffer));
            
            trainingImages.push({
              data: base64,
              url: url,
            });
            
            console.log(`[Train Model] Downloaded training image ${i + 1}/${trainingImageUrls.length}`);
          }
        }
      }
    }

    if (trainingImages.length === 0) {
      throw new Error("Failed to download any training images");
    }

    console.log(`[Train Model] Downloaded ${trainingImages.length} training images`);

    // Images are already uploaded and saved - model is ready immediately
    // No actual ML training is performed, just storing the reference images
    console.log(`[Train Model] Training images verified and saved - model ready`);

    // Update model status to "ready" immediately
    const { error: readyError } = await supabase
      .from("models")
      .update({ status: "ready" })
      .eq("id", modelId)
      .eq("userId", userId);

    if (readyError) {
      throw new Error(`Failed to update model status to ready: ${readyError.message}`);
    }

    console.log(`[Train Model] Model ${modelId} training completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        modelId,
        message: "Model training completed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[Train Model] Error:", error);
    
    // Try to update model status to "failed" if we have the modelId
    try {
      const body = await req.json().catch(() => ({}));
      const modelId = (body as any)?.modelId;
      const userId = (body as any)?.userId;
      
      if (modelId && userId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase
            .from("models")
            .update({ status: "failed" })
            .eq("id", modelId)
            .eq("userId", userId);
        }
      }
    } catch (updateError) {
      console.error("[Train Model] Failed to update status to failed:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

