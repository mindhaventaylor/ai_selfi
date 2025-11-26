import { COOKIE_NAME } from "../shared/const.js";
import { desc, eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { creditPacks, models, photos, transactions, users, modelTrainingImages, photoGenerationBatches, photoGenerationQueue, page2GenerationBatches, page2GenerationQueue, bugReports, featureSuggestions } from "../drizzle/schema.js";
import { getDb, upsertUser } from "./db.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { supabaseServer } from "./_core/lib/supabase.js";
import { systemRouter } from "./_core/systemRouter.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import { generateImagesWithGemini } from "./_core/gemini.js";
import { getServerString } from "./_core/strings.js";
import { ENV } from "./_core/env.js";
import { stripe, CREDIT_PACKS } from "./_core/stripe.js";

// Helper function to get API URL (local or production)
function getApiUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

// Helper function to get Supabase Edge Function URL
function getSupabaseFunctionUrl(functionName: string): string {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
  }
  
  // Remove trailing slash if present
  const baseUrl = supabaseUrl.endsWith("/") 
    ? supabaseUrl.slice(0, -1) 
    : supabaseUrl;
  
  // Edge Functions are at /functions/v1/<function-name>
  return `${baseUrl}/functions/v1/${functionName}`;
}

// Helper function to call local train-model API
async function callTrainModelApi(body: { modelId: number; userId: number; prompt: string }): Promise<any> {
  const apiUrl = getApiUrl();
  const trainModelUrl = `${apiUrl}/api/train-model`;
  
  try {
    const response = await fetch(trainModelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || JSON.stringify(errorJson);
      } catch {
        // Keep original error text
      }
      throw new Error(`Train model API failed: ${response.status} ${errorMessage}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`[callTrainModelApi] Error calling train-model API:`, error);
    throw error;
  }
}

// Helper function to call Supabase Edge Function
async function callSupabaseFunction(
  functionName: string,
  body: any
): Promise<any> {
  const functionUrl = getSupabaseFunctionUrl(functionName);
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  }
  
  try {
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
      "apikey": supabaseServiceKey,
    },
    body: JSON.stringify(body),
  });
    
    const responseText = await response.text();
  
  if (!response.ok) {
      // Try to parse as JSON first
      let errorMessage = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.error || errorJson.message || JSON.stringify(errorJson);
      } catch {
        // If not JSON, check if it's HTML or encoded
        if (responseText.includes("<!doctype") || responseText.includes("<html")) {
          errorMessage = `Edge Function returned HTML instead of JSON. This usually means the function is not deployed or the URL is incorrect.`;
        } else if (responseText.length > 500) {
          // Likely encoded data, try to decode
          try {
            // Try base64 decode
            const decoded = Buffer.from(responseText, 'base64').toString('utf-8');
            errorMessage = `Edge Function returned encoded data. Decoded: ${decoded.substring(0, 200)}...`;
          } catch {
            errorMessage = `Edge Function returned unexpected response (${responseText.length} chars). First 200 chars: ${responseText.substring(0, 200)}...`;
          }
        }
      }
      
      console.error(`[callSupabaseFunction] ${functionName} failed:`, {
        status: response.status,
        statusText: response.statusText,
        url: functionUrl,
        error: errorMessage,
      });
      
    throw new Error(
        `Edge Function ${functionName} failed: ${response.status} ${errorMessage}`
      );
    }
    
    // Try to parse response as JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[callSupabaseFunction] Failed to parse response from ${functionName}:`, {
        responseText: responseText.substring(0, 500),
        parseError,
      });
      throw new Error(
        `Edge Function ${functionName} returned invalid JSON: ${responseText.substring(0, 200)}`
      );
    }
  } catch (error: any) {
    // Re-throw if it's already our formatted error
    if (error.message?.includes("Edge Function")) {
      throw error;
    }
    
    // Otherwise, wrap the error
    console.error(`[callSupabaseFunction] Network or other error calling ${functionName}:`, error);
    throw new Error(
      `Failed to call Edge Function ${functionName}: ${error.message || "Unknown error"}`
    );
  }
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    syncSession: publicProcedure
      .input(z.object({ accessToken: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        try {
          console.log("[Auth] syncSession called with token length:", input.accessToken.length);
          
          // Check if Supabase is configured
          if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const errorMsg = getServerString("supabaseNotConfigured");
            console.error("[Auth]", errorMsg);
            throw new Error(errorMsg);
          }

          // Verify Supabase session and sync user
          const { data: { user }, error } = await (supabaseServer.auth as any).getUser(input.accessToken);
          
          if (error) {
            console.error("[Auth] Token verification error:", {
              message: error.message,
              status: error.status,
              name: error.name,
            });
            // Include the error message in a way that will be visible to the client
            const errorMsg = error.message || "Unknown error";
            throw new Error(`${getServerString("tokenVerificationFailed")}: ${errorMsg}`);
          }
          
          if (!user) {
            console.error("[Auth] No user returned from token verification");
            throw new Error(getServerString("invalidAccessToken"));
          }

          console.log("[Auth] Syncing user:", user.id, user.email);

          // Sync user to database
          await upsertUser({
            openId: user.id,
            name: user.user_metadata?.name || user.user_metadata?.full_name || null,
            email: user.email ?? null,
            avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            loginMethod: user.app_metadata?.provider || "oauth",
            lastSignedIn: new Date(),
          });

          // Set session cookie for future requests
          const cookieOptions = getSessionCookieOptions(ctx.req as any);
          const sessionData = {
            access_token: input.accessToken,
          };
          const cookieValue = Buffer.from(JSON.stringify(sessionData)).toString("base64");
          const AUTH_COOKIE_NAME = `sb-${ENV.supabaseProjectRef}-auth-token`;
          (ctx.res as any).cookie(AUTH_COOKIE_NAME, cookieValue, { 
            ...cookieOptions, 
            maxAge: 60 * 60 * 24 * 365 * 1000 // 1 year
          });

          console.log("[Auth] Session synced successfully for user:", user.id);
          return { success: true };
        } catch (error: any) {
          console.error("[Auth] Sync session error:", {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
          });
          // Re-throw with a more user-friendly message if it's a configuration error
          if (error?.message?.includes("not configured")) {
            throw new Error(getServerString("serverConfigurationError"));
          }
          throw error;
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req as any);
      const AUTH_COOKIE_NAME = `sb-${ENV.supabaseProjectRef}-auth-token`;
      
      // Clear both the old cookie name and the Supabase auth cookie
      (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      (ctx.res as any).clearCookie(AUTH_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      
      return {
        success: true,
      } as const;
    }),
  }),
  payment: router({
    listPacks: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(creditPacks).orderBy(creditPacks.price);
    }),
    createCheckoutSession: protectedProcedure
      .input(z.object({ 
        packId: z.number(),
        currency: z.enum(["USD", "EUR"]).optional().default("USD"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error(getServerString("databaseNotAvailable"));
        
        const packResult = await db.select().from(creditPacks).where(eq(creditPacks.id, input.packId)).limit(1);
        const pack = packResult[0];

        if (!pack) throw new Error(getServerString("packNotFound"));

        // Get the base URL for success/cancel URLs
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : process.env.PHOTO_API_URL?.replace("/api/photo-generation", "") || "http://localhost:3000";

        // Convert price based on currency
        // Base price is in USD, convert to EUR if needed
        const basePriceUSD = parseFloat(pack.price.toString());
        let finalPrice = basePriceUSD;
        const currency = input.currency.toLowerCase() as "usd" | "eur";
        
        if (currency === "eur") {
          // Convert USD to EUR (approximate rate: 1 USD = 0.92 EUR)
          finalPrice = basePriceUSD * 0.92;
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: currency,
                product_data: {
                  name: `${pack.credits} Credits`,
                  description: `Purchase ${pack.credits} credits for AI image generation`,
                },
                unit_amount: Math.round(finalPrice * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/payment/cancel`,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            userId: ctx.user.id.toString(),
            packId: pack.id.toString(),
            credits: pack.credits.toString(),
            currency: currency,
          },
        });

        // Create pending transaction
        await db.insert(transactions).values({
          userId: ctx.user.id,
          packId: pack.id,
          amount: pack.price.toString(),
          status: "pending",
          stripePaymentId: session.id,
        });

        return { 
          sessionId: session.id,
          url: session.url,
        };
    }),
    createTransaction: protectedProcedure
      .input(z.object({ packId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error(getServerString("databaseNotAvailable"));
        
        const packResult = await db.select().from(creditPacks).where(eq(creditPacks.id, input.packId)).limit(1);
        const pack = packResult[0];

        if (!pack) throw new Error(getServerString("packNotFound"));

        // Mock transaction creation - in real app, integrate Stripe here
        await db.insert(transactions).values({
          userId: ctx.user.id,
          packId: pack.id,
          amount: pack.price.toString(), // Convert decimal to string for insertion
          status: "completed", // Auto-complete for mock
        });

        // Add credits to user
        await db
          .update(users)
          .set({ credits: (ctx.user.credits || 0) + pack.credits })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),
  }),
  model: router({
    uploadTrainingImages: protectedProcedure
      .input(z.object({
        images: z.array(z.object({
          data: z.string(), // base64 encoded image
          fileName: z.string(),
          contentType: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const uploadedUrls: string[] = [];
        const baseTimestamp = Date.now();
        
        for (let i = 0; i < input.images.length; i++) {
          const image = input.images[i];
          const imageBuffer = Buffer.from(image.data, "base64");
          const fileName = `training/${ctx.user.id}/${baseTimestamp}-${i}-${image.fileName}`;
          
          // Upload using service role (bypasses RLS)
          const { data: uploadData, error: uploadError } = await supabaseServer.storage
            .from("model-training-images")
            .upload(fileName, imageBuffer, {
              contentType: image.contentType,
              upsert: false,
            });

          if (uploadError) {
            throw new Error(`Erro ao fazer upload da imagem ${i + 1}: ${uploadError.message}`);
          }

          // Get signed URL for private bucket
          const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
            .from("model-training-images")
            .createSignedUrl(fileName, 3600 * 24 * 365); // 1 year expiry

          if (signedUrlError || !signedUrlData) {
            throw new Error(`Erro ao criar URL assinada para imagem ${i + 1}: ${signedUrlError?.message || 'Unknown error'}`);
          }

          uploadedUrls.push(signedUrlData.signedUrl);
        }

        return { urls: uploadedUrls };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      
      // Use Supabase REST API if direct DB connection is not available
      if (!db) {
        const { data, error } = await supabaseServer
          .from('models')
          .select('*')
          .eq('userId', ctx.user.id)
          .order('createdAt', { ascending: false });
        
        if (error) {
          console.error("Error fetching models via REST API:", error);
          return [];
        }
        
        return data || [];
      }
      
      return db
        .select()
        .from(models)
        .where(eq(models.userId, ctx.user.id))
        .orderBy(desc(models.createdAt));
    }),
    getTrainingImages: protectedProcedure
      .input(z.object({ modelId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        
        // Verify ownership first
        if (!db) {
          const { data: model } = await supabaseServer
            .from('models')
            .select('id, userId')
            .eq('id', input.modelId)
            .eq('userId', ctx.user.id)
            .single();
          
          if (!model) {
            throw new Error(getServerString("modelNotFound"));
          }
          
          // Fetch training images via REST API
          const { data, error } = await supabaseServer
            .from('model_training_images')
            .select('imageUrl, imageOrder')
            .eq('modelId', input.modelId)
            .order('imageOrder', { ascending: true });
          
          if (error) {
            console.error("Error fetching training images via REST API:", error);
            return [];
          }
          
          return (data || []).map((img: any) => img.imageUrl);
        }
        
        // Verify ownership
        const [model] = await db
          .select()
          .from(models)
          .where(and(eq(models.id, input.modelId), eq(models.userId, ctx.user.id)))
          .limit(1);
        
        if (!model) {
          throw new Error(getServerString("modelNotFound"));
        }
        
        // Fetch training images
        const trainingImages = await db
          .select({ imageUrl: modelTrainingImages.imageUrl })
          .from(modelTrainingImages)
          .where(eq(modelTrainingImages.modelId, input.modelId))
          .orderBy(modelTrainingImages.imageOrder);
        
        return trainingImages.map(img => img.imageUrl);
    }),
    create: protectedProcedure
      .input(z.object({ 
        name: z.string(), 
        gender: z.enum(["hombre", "mujer"]),
        trainingImageUrls: z.array(z.string()).min(1).max(5),
        trainingCreditsUsed: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        
        // Check if user has enough credits
        if ((ctx.user.credits || 0) < input.trainingCreditsUsed) {
          throw new Error(getServerString("insufficientCreditsForTraining"));
        }

        // Use Supabase REST API if direct DB connection is not available
        if (!db) {
          // Deduct credits if needed
          if (input.trainingCreditsUsed > 0) {
            const { error: updateError } = await supabaseServer
              .from('users')
              .update({ credits: (ctx.user.credits || 0) - input.trainingCreditsUsed })
              .eq('id', ctx.user.id);
            
            if (updateError) throw new Error(`${getServerString("failedToUpdateCredits")}: ${updateError.message}`);
          }

          // Create model via REST API
          const { data: modelData, error: modelError } = await supabaseServer
            .from('models')
            .insert({
              userId: ctx.user.id,
              name: input.name,
              gender: input.gender,
              status: "training",
              imagesCount: input.trainingImageUrls.length,
              trainingCreditsUsed: input.trainingCreditsUsed,
              previewImageUrl: input.trainingImageUrls[0] || null, // Use the first uploaded image (index 0) as preview
            })
            .select()
            .single();

          if (modelError) throw new Error(`${getServerString("failedToCreateModel")}: ${modelError.message}`);

          // Insert training images via REST API
          if (modelData && input.trainingImageUrls.length > 0) {
            const trainingImagesData = input.trainingImageUrls.map((url, index) => ({
              modelId: modelData.id,
              imageUrl: url,
              imageOrder: index + 1,
            }));

            const { error: imagesError } = await supabaseServer
              .from('model_training_images')
              .insert(trainingImagesData);

            if (imagesError) throw new Error(`${getServerString("failedToInsertTrainingImages")}: ${imagesError.message}`);
          }

          // Call train-model API for async training (runs even if site is down)
          if (modelData) {
            try {
              console.log(`[Model Training] Calling train-model API for model ${modelData.id}`);
              
              // Generate prompt from model information
              const trainingPrompt = `Train a model for ${input.name}, ${input.gender === "hombre" ? "male" : "female"} gender, with ${input.trainingImageUrls.length} training images`;
              
              // Call API asynchronously (don't await - let it run in background)
              callTrainModelApi({
                modelId: modelData.id,
                userId: ctx.user.id,
                prompt: trainingPrompt,
            }).catch(async (error: any) => {
              const errorMessage = error?.message || String(error);
              console.error(`[Model Training] Train model API error for model ${modelData.id}:`, {
                error: errorMessage,
                modelId: modelData.id,
                userId: ctx.user.id,
                stack: error?.stack,
              });
              
              // Try to set status to "failed" if API fails
              try {
                const { error: updateError } = await supabaseServer
                  .from('models')
                  .update({ status: "failed" })
                  .eq('id', modelData.id);
                
                if (updateError) {
                  console.error(`[Model Training] Error setting model ${modelData.id} to failed:`, updateError);
                } else {
                  console.log(`[Model Training] Model ${modelData.id} status set to failed due to API error`);
                }
              } catch (failError: any) {
                console.error(`[Model Training] Error setting model ${modelData.id} to failed:`, failError);
              }
            });
              
              console.log(`[Model Training] Train model API called for model ${modelData.id} (processing asynchronously)`);
              } catch (error) {
              console.error(`[Model Training] Error calling train-model API for model ${modelData.id}:`, error);
              // Set status to "failed" if we can't even call the API
                  await supabaseServer
                    .from('models')
                    .update({ status: "failed" })
                    .eq('id', modelData.id);
                }
          }

          return { success: true, modelId: modelData?.id };
        }

        // Use direct database connection
        // Deduct credits
        if (input.trainingCreditsUsed > 0) {
          await db
            .update(users)
            .set({ credits: (ctx.user.credits || 0) - input.trainingCreditsUsed })
            .where(eq(users.id, ctx.user.id));
        }

        // Create model
        // IMPORTANT: input.trainingImageUrls[0] is the first image uploaded by the user
        const [model] = await db.insert(models).values({
          userId: ctx.user.id,
          name: input.name,
          gender: input.gender,
          status: "training",
          imagesCount: input.trainingImageUrls.length,
          trainingCreditsUsed: input.trainingCreditsUsed,
          previewImageUrl: input.trainingImageUrls[0] || null, // Use the first uploaded image (index 0) as preview
        }).returning();
        
        console.log(`[Model Create] Model ${model?.id} created with preview: ${input.trainingImageUrls[0]}`);

        // Insert training images
        if (model && input.trainingImageUrls.length > 0) {
          await db.insert(modelTrainingImages).values(
            input.trainingImageUrls.map((url, index) => ({
              modelId: model.id,
              imageUrl: url,
              imageOrder: index + 1,
            }))
          );
        }

        // Call train-model API for async training (runs even if site is down)
        if (model) {
          try {
            console.log(`[Model Training] Calling train-model API for model ${model.id}`);
            
            // Generate prompt from model information
            const trainingPrompt = `Train a model for ${input.name}, ${input.gender === "hombre" ? "male" : "female"} gender, with ${input.trainingImageUrls.length} training images`;
            
            // Call API asynchronously (don't await - let it run in background)
            callTrainModelApi({
              modelId: model.id,
              userId: ctx.user.id,
              prompt: trainingPrompt,
            }).catch(async (error: any) => {
              const errorMessage = error?.message || String(error);
              console.error(`[Model Training] Train model API error for model ${model.id}:`, {
                error: errorMessage,
                modelId: model.id,
                userId: ctx.user.id,
                stack: error?.stack,
              });
              
              // Try to set status to "failed" if API fails
            try {
              const updateDb = await getDb();
              if (updateDb) {
                await updateDb
                  .update(models)
                    .set({ status: "failed" })
                  .where(eq(models.id, model.id));
              } else {
                  const { error: updateError } = await supabaseServer
                  .from('models')
                    .update({ status: "failed" })
                  .eq('id', model.id);
                  if (updateError) {
                    console.error(`[Model Training] Error setting model ${model.id} to failed via REST API:`, updateError);
                  } else {
                    console.log(`[Model Training] Model ${model.id} status set to failed due to API error`);
                  }
                }
              } catch (failError: any) {
                console.error(`[Model Training] Error setting model ${model.id} to failed:`, failError);
              }
            });
            
            console.log(`[Model Training] Train model API called for model ${model.id} (processing asynchronously)`);
            } catch (error) {
            console.error(`[Model Training] Error calling train-model API for model ${model.id}:`, error);
            // Set status to "failed" if we can't even call the Edge Function
                const updateDb = await getDb();
                if (updateDb) {
                  await updateDb
                    .update(models)
                    .set({ status: "failed" })
                    .where(eq(models.id, model.id));
                } else {
                  await supabaseServer
                    .from('models')
                    .update({ status: "failed" })
                    .eq('id', model.id);
                }
              }
        }

        return { success: true, modelId: model?.id };
      }),
    delete: protectedProcedure
      .input(z.object({ modelId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        // Use Supabase REST API if direct DB connection is not available
        if (!db) {
          // Verify ownership via REST API
          const { data: model, error: fetchError } = await supabaseServer
            .from('models')
            .select('id, userId')
            .eq('id', input.modelId)
            .eq('userId', ctx.user.id)
            .single();

          if (fetchError || !model) {
            throw new Error(getServerString("modelNotFound"));
          }

          // Delete training images first (cascade might not work via REST API)
          const { error: imagesError } = await supabaseServer
            .from('model_training_images')
            .delete()
            .eq('modelId', input.modelId);

          if (imagesError) {
            console.warn("Error deleting training images:", imagesError);
            // Continue with model deletion even if images deletion fails
          }

          // Delete model
          const { error: deleteError } = await supabaseServer
            .from('models')
            .delete()
            .eq('id', input.modelId)
            .eq('userId', ctx.user.id);

          if (deleteError) {
            throw new Error(`${getServerString("failedToDeleteModel")}: ${deleteError.message}`);
          }

          return { success: true };
        }

        // Use direct database connection
        // Verify ownership
        const [model] = await db
          .select()
          .from(models)
          .where(and(eq(models.id, input.modelId), eq(models.userId, ctx.user.id)))
          .limit(1);

        if (!model) {
          throw new Error(getServerString("modelNotFound"));
        }

        // Delete model (cascade will delete training images)
        await db.delete(models).where(eq(models.id, input.modelId));

        return { success: true };
      }),
  }),
  photo: router({
    getBatchStatus: protectedProcedure
      .input(z.object({ batchId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        
        if (!db) {
          // Use REST API
          const { data: batch, error } = await supabaseServer
            .from('photo_generation_batches')
            .select('id, status, totalImagesGenerated, createdAt, completedAt')
            .eq('id', input.batchId)
            .eq('userId', ctx.user.id)
            .single();
          
          if (error || !batch) {
            throw new Error("Batch not found");
          }
          
          // Check queue jobs status to detect failures early
          const { data: queueJobs } = await supabaseServer
            .from('photo_generation_queue')
            .select('id, status, errorMessage, numImagesPerExample')
            .eq('batchId', input.batchId);
          
          // If all jobs failed, update batch status
          if (queueJobs && queueJobs.length > 0) {
            const allFailed = queueJobs.every(j => j.status === "failed");
            const allCompleted = queueJobs.every(j => j.status === "completed" || j.status === "failed");
            
            if (allFailed && batch.status !== "failed") {
              await supabaseServer
                .from('photo_generation_batches')
                .update({ status: "failed" })
                .eq('id', input.batchId);
              batch.status = "failed";
            } else if (allCompleted && batch.status === "generating") {
              const successfulJobs = queueJobs.filter(j => j.status === "completed").length;
              const numImagesPerJob = (queueJobs[0] as any)?.numImagesPerExample || 4;
              await supabaseServer
                .from('photo_generation_batches')
                .update({
                  status: successfulJobs > 0 ? "completed" : "failed",
                  completedAt: new Date().toISOString(),
                  totalImagesGenerated: successfulJobs * numImagesPerJob,
                })
                .eq('id', input.batchId);
              batch.status = successfulJobs > 0 ? "completed" : "failed";
            }
          }
          
          // Get generated photos for this batch
          const { data: photos, error: photosError } = await supabaseServer
            .from('photos')
            .select('id, url, status')
            .eq('generationBatchId', input.batchId)
            .eq('userId', ctx.user.id)
            .order('id', { ascending: true });
          
          return {
            batch: {
              id: batch.id,
              status: batch.status,
              totalImagesGenerated: batch.totalImagesGenerated,
              createdAt: batch.createdAt,
              completedAt: batch.completedAt,
            },
            photos: (photos || []).map((p: any) => ({
              id: p.id,
              url: p.url,
              status: p.status,
            })),
          };
        }
        
        // Use direct database connection
        const [batch] = await db
          .select()
          .from(photoGenerationBatches)
          .where(
            and(
              eq(photoGenerationBatches.id, input.batchId),
              eq(photoGenerationBatches.userId, ctx.user.id)
            )
          )
          .limit(1);
        
        if (!batch) {
          throw new Error("Batch not found");
        }
        
        // Check queue jobs status to detect failures early
        const queueJobs = await db
          .select({ id: photoGenerationQueue.id, status: photoGenerationQueue.status, errorMessage: photoGenerationQueue.errorMessage, numImagesPerExample: photoGenerationQueue.numImagesPerExample })
          .from(photoGenerationQueue)
          .where(eq(photoGenerationQueue.batchId, input.batchId));
        
        // If all jobs failed, update batch status
        if (queueJobs && queueJobs.length > 0) {
          const allFailed = queueJobs.every(j => j.status === "failed");
          const allCompleted = queueJobs.every(j => j.status === "completed" || j.status === "failed");
          
          if (allFailed && batch.status !== "failed") {
            await db
              .update(photoGenerationBatches)
              .set({ status: "failed" })
              .where(eq(photoGenerationBatches.id, input.batchId));
            batch.status = "failed";
          } else if (allCompleted && batch.status === "generating") {
            const successfulJobs = queueJobs.filter(j => j.status === "completed").length;
            const numImagesPerJob = (queueJobs[0] as any)?.numImagesPerExample || 4;
            await db
              .update(photoGenerationBatches)
              .set({
                status: successfulJobs > 0 ? "completed" : "failed",
                completedAt: new Date(),
                totalImagesGenerated: successfulJobs * numImagesPerJob,
              })
              .where(eq(photoGenerationBatches.id, input.batchId));
            batch.status = successfulJobs > 0 ? "completed" : "failed";
          }
        }
        
        const batchPhotos = await db
          .select({
            id: photos.id,
            url: photos.url,
            status: photos.status,
          })
          .from(photos)
          .where(
            and(
              eq(photos.generationBatchId, input.batchId),
              eq(photos.userId, ctx.user.id)
            )
          )
          .orderBy(photos.id);
        
        return {
          batch: {
            id: batch.id,
            status: batch.status,
            totalImagesGenerated: batch.totalImagesGenerated,
            createdAt: batch.createdAt,
            completedAt: batch.completedAt,
          },
          photos: batchPhotos,
        };
      }),
    getPage2BatchStatus: protectedProcedure
      .input(z.object({ batchId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        
        if (!db) {
          // Use REST API
          const { data: batch, error } = await supabaseServer
            .from('page2_generation_batches')
            .select('id, status, totalImagesGenerated, createdAt, completedAt')
            .eq('id', input.batchId)
            .eq('userId', ctx.user.id)
            .single();
          
          if (error || !batch) {
            throw new Error("Batch not found");
          }
          
          // Check queue jobs status
          const { data: queueJobs } = await supabaseServer
            .from('page2_generation_queue')
            .select('id, status, errorMessage, generatedImageUrl')
            .eq('batchId', input.batchId);
          
          // Update batch status if needed
          if (queueJobs && queueJobs.length > 0) {
            const allFailed = queueJobs.every(j => j.status === "failed");
            const allCompleted = queueJobs.every(j => j.status === "completed" || j.status === "failed");
            
            if (allFailed && batch.status !== "failed") {
              await supabaseServer
                .from('page2_generation_batches')
                .update({ status: "failed" })
                .eq('id', input.batchId);
              batch.status = "failed";
            } else if (allCompleted && batch.status === "generating") {
              const successfulJobs = queueJobs.filter(j => j.status === "completed").length;
              await supabaseServer
                .from('page2_generation_batches')
                .update({
                  status: successfulJobs > 0 ? "completed" : "failed",
                  completedAt: new Date().toISOString(),
                })
                .eq('id', input.batchId);
              batch.status = successfulJobs > 0 ? "completed" : "failed";
            }
          }
          
          // Get generated photos - for page2, we get from photos table where page2GenerationBatchId matches
          const { data: photos } = await supabaseServer
            .from('photos')
            .select('id, url, status')
            .eq('userId', ctx.user.id)
            .eq('page2GenerationBatchId', input.batchId)
            .order('id', { ascending: true });
          
          return {
            batch: {
              id: batch.id,
              status: batch.status,
              totalImagesGenerated: batch.totalImagesGenerated,
              createdAt: batch.createdAt,
              completedAt: batch.completedAt,
            },
            photos: (photos || []).map((p: any) => ({
              id: p.id,
              url: p.url,
              status: p.status,
            })),
          };
        }
        
        // Use direct database connection
        const [batch] = await db
          .select()
          .from(page2GenerationBatches)
          .where(
            and(
              eq(page2GenerationBatches.id, input.batchId),
              eq(page2GenerationBatches.userId, ctx.user.id)
            )
          )
          .limit(1);
        
        if (!batch) {
          throw new Error("Batch not found");
        }
        
        // Check queue jobs
        const queueJobs = await db
          .select({ 
            id: page2GenerationQueue.id, 
            status: page2GenerationQueue.status, 
            errorMessage: page2GenerationQueue.errorMessage,
            generatedImageUrl: page2GenerationQueue.generatedImageUrl,
          })
          .from(page2GenerationQueue)
          .where(eq(page2GenerationQueue.batchId, input.batchId));
        
        // Update batch status if needed
        if (queueJobs && queueJobs.length > 0) {
          const allFailed = queueJobs.every(j => j.status === "failed");
          const allCompleted = queueJobs.every(j => j.status === "completed" || j.status === "failed");
          
          if (allFailed && batch.status !== "failed") {
            await db
              .update(page2GenerationBatches)
              .set({ status: "failed" })
              .where(eq(page2GenerationBatches.id, input.batchId));
            batch.status = "failed";
          } else if (allCompleted && batch.status === "generating") {
            const successfulJobs = queueJobs.filter(j => j.status === "completed").length;
            await db
              .update(page2GenerationBatches)
              .set({
                status: successfulJobs > 0 ? "completed" : "failed",
                completedAt: new Date(),
              })
              .where(eq(page2GenerationBatches.id, input.batchId));
            batch.status = successfulJobs > 0 ? "completed" : "failed";
          }
        }
        
        // Get generated photos - for page2, we get from photos table where page2GenerationBatchId matches
        const batchPhotos = await db
          .select({
            id: photos.id,
            url: photos.url,
            status: photos.status,
          })
          .from(photos)
          .where(
            and(
              eq(photos.userId, ctx.user.id),
              eq(photos.page2GenerationBatchId, input.batchId)
            )
          )
          .orderBy(photos.id);
        
        return {
          batch: {
            id: batch.id,
            status: batch.status,
            totalImagesGenerated: batch.totalImagesGenerated,
            createdAt: batch.createdAt,
            completedAt: batch.completedAt,
          },
          photos: batchPhotos,
        };
      }),
    list: protectedProcedure
      .input(z.object({ 
        sortBy: z.enum(["newest", "favourites"]).default("newest"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
      const db = await getDb();
        if (!db) return { photos: [], total: 0 };

        const whereConditions = [eq(photos.userId, ctx.user.id)];
        if (input?.sortBy === "favourites") {
          whereConditions.push(eq(photos.isFavorite, true));
        }

        const photosList = await db
          .select()
          .from(photos)
          .where(and(...whereConditions))
          .orderBy(desc(photos.createdAt))
          .limit(input?.limit || 50)
          .offset(input?.offset || 0);

        // Get total count
        const totalPhotos = await db
        .select()
        .from(photos)
          .where(and(...whereConditions));

        return { 
          photos: photosList, 
          total: totalPhotos.length 
        };
      }),
    generate: protectedProcedure
      .input(z.object({ 
        modelId: z.number().optional(), // Optional for page2 variant (no model required)
        trainingImageUrls: z.array(z.string()).optional(), // Optional for page2 variant
        exampleImages: z.array(z.object({
          id: z.number(),
          url: z.string(),
          prompt: z.string(),
        })).min(1), // Selected example images with prompts
        basePrompt: z.string(), // Base prompt with user options
        aspectRatio: z.enum(["1:1", "9:16", "16:9"]),
        numImagesPerExample: z.number().default(4), // Usually 4
        glasses: z.enum(["yes", "no"]),
        hairColor: z.string().optional(),
        hairStyle: z.string().optional(),
        backgrounds: z.array(z.string()).default([]),
        styles: z.array(z.string()).default([]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        
        // Calculate total images: numImagesPerExample * number of example images
        const totalImages = input.exampleImages.length * input.numImagesPerExample;
        const creditsNeeded = totalImages;
        
        console.log(`[Photo Generate] Total images to generate: ${totalImages}, Credits needed: ${creditsNeeded}, Example images: ${input.exampleImages.length}`);

        // Check credits
        if ((ctx.user.credits || 0) < creditsNeeded) {
           throw new Error(getServerString("insufficientCredits"));
        }

        // Verify model ownership only if modelId is provided (page1 variant)
        if (input.modelId) {
        if (!db) {
          // Verify model ownership via REST API
          const { data: model, error: modelError } = await supabaseServer
            .from('models')
            .select('id, userId, status')
            .eq('id', input.modelId)
            .eq('userId', ctx.user.id)
            .single();

          if (modelError || !model) {
            throw new Error(getServerString("modelNotFound"));
          }

          if (model.status !== "ready") {
            throw new Error(getServerString("modelNotReady"));
          }
        } else {
          // Get model to verify ownership (direct DB connection)
          const [model] = await db
            .select()
            .from(models)
            .where(and(eq(models.id, input.modelId), eq(models.userId, ctx.user.id)))
            .limit(1);

          if (!model) {
            throw new Error(getServerString("modelNotFound"));
          }

          if (model.status !== "ready") {
            throw new Error(getServerString("modelNotReady"));
          }
        }
        }
        // For page2 variant (no modelId), skip model verification

        // No need to fetch images here - Edge Function will handle it
        console.log(`\n${'='.repeat(80)}`);
        const trainingCount = input.trainingImageUrls?.length || 0;
        console.log(`[Photo Generate] 📥 Preparing batch with ${trainingCount} training image(s) and ${input.exampleImages.length} example image(s)`);
        if (!input.modelId) {
          console.log(`[Photo Generate] ⚠️  Page2 variant: No model required, using example images only`);
        }
        console.log(`${'='.repeat(80)}\n`);
        
        // Deduct credits immediately (before async processing)
        if (!db) {
          const { error: creditsError } = await supabaseServer
            .from('users')
            .update({ credits: (ctx.user.credits || 0) - creditsNeeded })
            .eq('id', ctx.user.id);

          if (creditsError) {
            throw new Error(`${getServerString("failedToDeductCredits")}: ${creditsError.message}`);
          }
        } else {
          await db
            .update(users)
            .set({ credits: (ctx.user.credits || 0) - creditsNeeded })
            .where(eq(users.id, ctx.user.id));
        }

        // Create generation batch with "generating" status
        let batchId: number | undefined;
        
        if (!db) {
          // Use REST API
          const { data: batchData, error: batchError } = await supabaseServer
            .from('photo_generation_batches')
            .insert({
              userId: ctx.user.id,
              modelId: input.modelId || null, // Null for page2 variant
              totalImagesGenerated: 0, // Will be updated by Edge Function
              creditsUsed: creditsNeeded,
              aspectRatio: input.aspectRatio,
              glasses: input.glasses,
              hairColor: input.hairColor || null,
              hairStyle: input.hairStyle || null,
              backgrounds: input.backgrounds,
              styles: input.styles,
              status: "generating", // Edge Function will update to "completed"
            })
            .select()
            .single();

          if (batchError) {
            throw new Error(`${getServerString("failedToCreateGenerationBatch")}: ${batchError.message}`);
          }

          batchId = batchData?.id;
        } else {
          // Use direct database connection
          const [batch] = await db.insert(photoGenerationBatches).values({
            userId: ctx.user.id,
            ...(input.modelId ? { modelId: input.modelId } : {}), // Only include if provided
            totalImagesGenerated: 0, // Will be updated by Edge Function
            creditsUsed: creditsNeeded,
            aspectRatio: input.aspectRatio,
            glasses: input.glasses,
            hairColor: input.hairColor || null,
            hairStyle: input.hairStyle || null,
            backgrounds: input.backgrounds,
            styles: input.styles,
            status: "generating", // Edge Function will update to "completed"
          }).returning();

          batchId = batch?.id;
        }

        if (!batchId) {
          throw new Error("Failed to create generation batch");
        }

        if (!batchId) {
          throw new Error("Failed to create generation batch");
        }

        console.log(`\n${'='.repeat(80)}`);
        console.log(`[Photo Generate] Preparing queue jobs for batch ${batchId}`);

        const jobs = input.exampleImages.map(example => ({
          batchId,
            userId: ctx.user.id,
          ...(input.modelId ? { modelId: input.modelId } : {}), // Only include if provided
          exampleImageId: example.id,
          exampleImageUrl: example.url,
          exampleImagePrompt: example.prompt,
          trainingImageUrls: input.trainingImageUrls || [], // Empty array for page2 variant
          basePrompt: input.basePrompt,
            aspectRatio: input.aspectRatio,
          numImagesPerExample: input.numImagesPerExample,
            glasses: input.glasses,
          hairColor: input.hairColor ?? null,
          hairStyle: input.hairStyle ?? null,
            backgrounds: input.backgrounds,
            styles: input.styles,
        }));

        let insertedJobs: any[] = [];

            if (!db) {
          const { data: insertedData, error: queueError } = await supabaseServer
            .from("photo_generation_queue")
            .insert(jobs)
            .select();

          if (queueError) {
            console.error("[Photo Generate] Failed to insert queue jobs (REST):", queueError);
            await supabaseServer
              .from("photo_generation_batches")
                .update({ status: "failed" })
              .eq("id", batchId);
            throw new Error("Failed to enqueue generation jobs");
          }
          insertedJobs = insertedData || [];
            } else {
          const inserted = await db.insert(photoGenerationQueue).values(jobs).returning();
          insertedJobs = inserted;
        }

        console.log(`[Photo Generate] ✅ Enqueued ${jobs.length} job(s) for batch ${batchId}`);

        // Call API directly for each job (don't await - process in background)
        // Determine API URL: use env var, or construct from current request, or default to localhost
        let apiUrl = process.env.PHOTO_API_URL;
        if (!apiUrl) {
          if (process.env.VERCEL_URL) {
            // Production: use Vercel URL
            apiUrl = `https://${process.env.VERCEL_URL}/api/photo-generation`;
          } else {
            // Development: use localhost
            apiUrl = `http://localhost:${process.env.PORT || 3000}/api/photo-generation`;
          }
        }
        
        console.log(`[Photo Generate] 🚀 Triggering API processing at ${apiUrl}...`);
        
        // In production (Vercel), we need to await the API calls to ensure they complete
        // In serverless environments, background tasks are killed when the function returns
        for (const job of insertedJobs) {
          try {
            const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(job),
            });
            
              if (!response.ok) {
                console.error(`[Photo Generate] API error for job ${job.id}: ${response.status}`);
              } else {
              console.log(`[Photo Generate] ✅ API processing completed for job ${job.id}`);
              }
          } catch (error) {
              console.error(`[Photo Generate] Failed to trigger API for job ${job.id}:`, error);
          }
        }
        
        console.log(`[Photo Generate] ✅ Completed API processing for ${insertedJobs.length} job(s)`);

        return { 
          success: true, 
          batchId,
          message: "Image generation jobs queued. Processing will happen shortly.",
        };
      }),
    generateFromPage2: protectedProcedure
      .input(z.object({
        // User's uploaded images (base64)
        userImages: z.array(z.object({
          data: z.string(), // base64 encoded image
          fileName: z.string(),
          contentType: z.string(),
        })).min(1).max(10),
        // Form data from DashboardV2
        formData: z.object({
          gender: z.string().optional(),
          age: z.string().optional(),
          hairColor: z.string().optional(),
          hairLength: z.string().optional(),
          hairStyle: z.string().optional(),
          ethnicity: z.string().optional(),
          bodyType: z.string().optional(),
          attire: z.array(z.string()).default([]),
          backgrounds: z.array(z.string()).default([]),
        }),
        // Example image to use (default to first one)
        exampleImageId: z.number().default(1),
        aspectRatio: z.enum(["1:1", "9:16", "16:9"]).default("9:16"),
        numImagesPerExample: z.number().default(4),
      }))
      .mutation(async ({ ctx, input }) => {
        // Helper function to map hairStyle values to valid database values
        const mapHairStyle = (hairStyle: string | undefined | null): string | null => {
          if (!hairStyle) return null;
          
          // Map DashboardV2 values to database values
          const hairStyleMap: Record<string, string> = {
            "wavy": "curly", // Map wavy to curly
            "straight": "medium", // Map straight to medium
            "curly": "curly",
            "dreadlocks": "curly", // Map dreadlocks to curly
            "short": "short",
            "medium": "medium",
            "long": "long",
            "no-preference": "no-preference",
          };
          
          const mappedValue = hairStyleMap[hairStyle] || hairStyle;
          
          // Only allow valid values, otherwise set to null
          const validHairStyles = ["no-preference", "short", "medium", "long", "curly"];
          return validHairStyles.includes(mappedValue) ? mappedValue : null;
        };
        
        console.log(`[Photo Generate Page2] Starting generation for user ${ctx.user.id}`);
        console.log(`[Photo Generate Page2] User images: ${input.userImages.length}, Example image ID: ${input.exampleImageId}`);
        
        // First, upload user images to storage
        const uploadedUrls: string[] = [];
        const baseTimestamp = Date.now();
        
        for (let i = 0; i < input.userImages.length; i++) {
          const image = input.userImages[i];
          const imageBuffer = Buffer.from(image.data, "base64");
          const fileName = `page2/${ctx.user.id}/${baseTimestamp}-${i}-${image.fileName}`;
          
          // Upload using service role (bypasses RLS)
          const { data: uploadData, error: uploadError } = await supabaseServer.storage
            .from("model-training-images")
            .upload(fileName, imageBuffer, {
              contentType: image.contentType,
              upsert: false,
            });

          if (uploadError) {
            throw new Error(`Failed to upload user image ${i + 1}: ${uploadError.message}`);
          }

          // Get signed URL for private bucket
          const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
            .from("model-training-images")
            .createSignedUrl(fileName, 3600 * 24 * 365); // 1 year expiry

          if (signedUrlError || !signedUrlData) {
            throw new Error(`Failed to create signed URL for image ${i + 1}: ${signedUrlError?.message || 'Unknown error'}`);
          }

          uploadedUrls.push(signedUrlData.signedUrl);
        }

        console.log(`[Photo Generate Page2] ✅ Uploaded ${uploadedUrls.length} user images`);

        // Get example image URL - use the first example image
        const exampleImageUrl = "https://gxwtcdplfkjfidwyrunk.supabase.co/storage/v1/object/public/example-images/image.webp";
        const exampleImagePrompt = "Create a professional business portrait with formal attire, corporate setting, confident pose, high-quality studio lighting";

        // Build base prompt from form data
        let basePrompt = `Create a photorealistic professional portrait image of the person in the reference photos.`;
        
        if (input.formData.gender) {
          basePrompt += ` Gender: ${input.formData.gender}.`;
        }
        if (input.formData.age) {
          basePrompt += ` Age: ${input.formData.age}.`;
        }
        if (input.formData.hairColor) {
          basePrompt += ` Hair color: ${input.formData.hairColor}.`;
        }
        if (input.formData.hairLength) {
          basePrompt += ` Hair length: ${input.formData.hairLength}.`;
        }
        if (input.formData.hairStyle) {
          basePrompt += ` Hair style: ${input.formData.hairStyle}.`;
        }
        if (input.formData.ethnicity) {
          basePrompt += ` Ethnicity: ${input.formData.ethnicity}.`;
        }
        if (input.formData.bodyType) {
          basePrompt += ` Body type: ${input.formData.bodyType}.`;
        }
        if (input.formData.attire && input.formData.attire.length > 0) {
          basePrompt += ` Attire: ${input.formData.attire.join(", ")}.`;
        }
        if (input.formData.backgrounds && input.formData.backgrounds.length > 0) {
          basePrompt += ` Background: ${input.formData.backgrounds.join(", ")}.`;
        }
        
        basePrompt += ` High quality, professional photography, natural lighting, sharp focus.`;

        // Calculate total images and credits
        const totalImages = input.numImagesPerExample;
        const creditsNeeded = totalImages;
        
        console.log(`[Photo Generate Page2] Total images to generate: ${totalImages}, Credits needed: ${creditsNeeded}`);

        // Check credits
        const db = await getDb();
        if ((ctx.user.credits || 0) < creditsNeeded) {
          throw new Error(getServerString("insufficientCredits"));
        }

        // Deduct credits immediately
        const userCreditsBefore = ctx.user.credits || 0;
        const userCreditsAfter = userCreditsBefore - creditsNeeded;
        
        if (!db) {
          const { error: creditsError } = await supabaseServer
            .from('users')
            .update({ credits: userCreditsAfter })
            .eq('id', ctx.user.id);

          if (creditsError) {
            throw new Error(`${getServerString("failedToDeductCredits")}: ${creditsError.message}`);
          }
          
          console.log(`[Photo Generate Page2] ✅ Credits deducted: ${userCreditsBefore} → ${userCreditsAfter} (${creditsNeeded} credits used)`);
        } else {
          await db
            .update(users)
            .set({ credits: userCreditsAfter })
            .where(eq(users.id, ctx.user.id));
          
          console.log(`[Photo Generate Page2] ✅ Credits deducted: ${userCreditsBefore} → ${userCreditsAfter} (${creditsNeeded} credits used)`);
        }

        // Create generation batch
        let batchId: number | undefined;
        
        if (!db) {
          // For page2, don't include modelId in the insert (it's optional)
          const insertData: any = {
            userId: ctx.user.id,
            totalImagesGenerated: 0,
            creditsUsed: creditsNeeded,
            aspectRatio: input.aspectRatio,
            glasses: "no",
            hairColor: input.formData.hairColor || null,
            hairStyle: mapHairStyle(input.formData.hairStyle),
            backgrounds: input.formData.backgrounds,
            styles: input.formData.attire,
            status: "generating",
          };
          
          const { data: batchData, error: batchError } = await supabaseServer
            .from('page2_generation_batches')
            .insert(insertData)
            .select()
            .single();

          if (batchError) {
            throw new Error(`${getServerString("failedToCreateGenerationBatch")}: ${batchError.message}`);
          }

          batchId = batchData?.id;
        } else {
          // For page2, modelId is optional - use undefined instead of null
          const batchValues: any = {
            userId: ctx.user.id,
            totalImagesGenerated: 0,
            creditsUsed: creditsNeeded,
            aspectRatio: input.aspectRatio,
            glasses: "no",
            hairColor: input.formData.hairColor || null,
            hairStyle: mapHairStyle(input.formData.hairStyle),
            backgrounds: input.formData.backgrounds,
            styles: input.formData.attire,
            status: "generating",
          };
          
          // Only include modelId if it's not null/undefined (for page2, it's undefined)
          // Don't include modelId at all for page2 variant
          
          const [batch] = await db.insert(page2GenerationBatches).values(batchValues).returning();

          batchId = batch?.id;
        }

        if (!batchId) {
          throw new Error("Failed to create generation batch");
        }

        console.log(`[Photo Generate Page2] ✅ Created batch ${batchId}`);

        // Create queue job
        const absoluteExampleUrl = exampleImageUrl; // Already absolute URL

        if (!db) {
          // For page2, don't include modelId in the insert (it's optional)
          const queueInsertData: any = {
          batchId: batchId,
            userId: ctx.user.id,
            exampleImageId: input.exampleImageId,
            exampleImageUrl: absoluteExampleUrl,
            exampleImagePrompt: exampleImagePrompt,
            trainingImageUrls: uploadedUrls, // User's uploaded images
            basePrompt: basePrompt,
            aspectRatio: input.aspectRatio,
            numImagesPerExample: input.numImagesPerExample,
            glasses: "no",
            hairColor: input.formData.hairColor || null,
            hairStyle: input.formData.hairStyle || null,
            backgrounds: input.formData.backgrounds,
            styles: input.formData.attire,
            status: "pending",
          };
          
          const { data: queueData, error: queueError } = await supabaseServer
            .from('page2_generation_queue')
            .insert(queueInsertData)
            .select()
            .single();

          if (queueError) {
            console.error(`[Photo Generate Page2] ❌ Failed to create queue job:`, queueError);
            throw new Error(`Failed to create queue job: ${queueError.message}`);
          }

          const queueJobId = queueData?.id;
          if (queueJobId) {
            console.log(`[Photo Generate Page2] ✅ Created queue job ${queueJobId}`);
            
            // Trigger API processing (use new page2 API)
            const apiUrl = process.env.VERCEL_URL 
              ? `https://${process.env.VERCEL_URL}/api/photo-generation-page2`
              : process.env.PHOTO_API_URL || "http://localhost:3000/api/photo-generation-page2";
            
            console.log(`[Photo Generate Page2] 🚀 Triggering API processing for job ${queueJobId}`);
            
            // In production (Vercel), we need to await the API call to ensure it completes
            // In serverless environments, background tasks are killed when the function returns
            try {
              const response = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: queueJobId,
                batchId: batchId,
                userId: ctx.user.id,
                exampleImageId: input.exampleImageId,
                exampleImageUrl: absoluteExampleUrl,
                exampleImagePrompt: exampleImagePrompt,
                trainingImageUrls: uploadedUrls,
                basePrompt: basePrompt,
                aspectRatio: input.aspectRatio,
                numImagesPerExample: input.numImagesPerExample,
                glasses: "no",
                hairColor: input.formData.hairColor || null,
                hairStyle: mapHairStyle(input.formData.hairStyle),
                backgrounds: input.formData.backgrounds,
                styles: input.formData.attire,
              }),
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Photo Generate Page2] ❌ API error for job ${queueJobId}: ${response.status} ${errorText}`);
              } else {
                console.log(`[Photo Generate Page2] ✅ API processing completed for job ${queueJobId}`);
              }
            } catch (error) {
              console.error(`[Photo Generate Page2] ❌ API call error:`, error);
            }
          }
        } else {
          // Use direct database connection
          // For page2, don't include modelId (it's optional)
          const queueJobValues: any = {
            batchId: batchId,
            userId: ctx.user.id,
            exampleImageId: input.exampleImageId,
            exampleImageUrl: absoluteExampleUrl,
            exampleImagePrompt: exampleImagePrompt,
            trainingImageUrls: uploadedUrls,
            basePrompt: basePrompt,
            aspectRatio: input.aspectRatio,
            numImagesPerExample: input.numImagesPerExample,
            glasses: "no",
            hairColor: input.formData.hairColor || null,
            hairStyle: mapHairStyle(input.formData.hairStyle),
            backgrounds: input.formData.backgrounds,
            styles: input.formData.attire,
            status: "pending",
          };
          
          const [queueJob] = await db.insert(page2GenerationQueue).values(queueJobValues).returning();

          if (queueJob?.id) {
            console.log(`[Photo Generate Page2] ✅ Created queue job ${queueJob.id}`);
            
            // Trigger API processing (use new page2 API)
            const apiUrl = process.env.VERCEL_URL 
              ? `https://${process.env.VERCEL_URL}/api/photo-generation-page2`
              : process.env.PHOTO_API_URL || "http://localhost:3000/api/photo-generation-page2";
            
            console.log(`[Photo Generate Page2] 🚀 Triggering API processing for job ${queueJob.id}`);
            
            // In production (Vercel), we need to await the API call to ensure it completes
            // In serverless environments, background tasks are killed when the function returns
            try {
              const response = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: queueJob.id,
                batchId: batchId,
                userId: ctx.user.id,
                exampleImageId: input.exampleImageId,
                exampleImageUrl: absoluteExampleUrl,
                exampleImagePrompt: exampleImagePrompt,
                trainingImageUrls: uploadedUrls,
                basePrompt: basePrompt,
                aspectRatio: input.aspectRatio,
                numImagesPerExample: input.numImagesPerExample,
                glasses: "no",
                hairColor: input.formData.hairColor || null,
                hairStyle: mapHairStyle(input.formData.hairStyle),
                backgrounds: input.formData.backgrounds,
                styles: input.formData.attire,
              }),
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Photo Generate Page2] ❌ API error for job ${queueJob.id}: ${response.status} ${errorText}`);
              } else {
                console.log(`[Photo Generate Page2] ✅ API processing completed for job ${queueJob.id}`);
              }
            } catch (error) {
              console.error(`[Photo Generate Page2] ❌ API call error:`, error);
            }
          }
        }

        return { batchId, success: true };
      }),
    createBatch: protectedProcedure
      .input(z.object({ 
        modelId: z.number(),
        totalImages: z.number(),
        aspectRatio: z.enum(["1:1", "9:16", "16:9"]),
        glasses: z.enum(["yes", "no"]),
        hairColor: z.string().optional(),
        hairStyle: z.string().optional(),
        backgrounds: z.array(z.string()).default([]),
        styles: z.array(z.string()).default([]),
        imageUrls: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error(getServerString("databaseNotAvailable"));

        // Check credits
        const creditsNeeded = input.totalImages;
        if ((ctx.user.credits || 0) < creditsNeeded) {
           throw new Error(getServerString("insufficientCredits"));
        }

        // Create generation batch
        const [batch] = await db.insert(photoGenerationBatches).values({
          userId: ctx.user.id,
          modelId: input.modelId,
          totalImagesGenerated: input.totalImages,
          creditsUsed: creditsNeeded,
          aspectRatio: input.aspectRatio,
          glasses: input.glasses,
          hairColor: input.hairColor || null,
          hairStyle: input.hairStyle || null,
          backgrounds: input.backgrounds,
          styles: input.styles,
          status: "completed",
          completedAt: new Date(),
        }).returning();

        // Create photo records
        const photoRecords = input.imageUrls.map((url, index) => ({
          userId: ctx.user.id,
          modelId: input.modelId,
          generationBatchId: batch?.id,
          url: url,
          status: "completed" as const,
          creditsUsed: 1,
          aspectRatio: input.aspectRatio,
          glasses: input.glasses,
          hairColor: input.hairColor || null,
          hairStyle: input.hairStyle || null,
          backgrounds: input.backgrounds,
          styles: input.styles,
        }));

        await db.insert(photos).values(photoRecords);

        // Deduct credits
        await db
          .update(users)
          .set({ credits: (ctx.user.credits || 0) - creditsNeeded })
          .where(eq(users.id, ctx.user.id));

        return { success: true, batchId: batch?.id };
      }),
    toggleFavorite: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error(getServerString("databaseNotAvailable"));

        // Verify ownership
        const [photo] = await db
          .select()
          .from(photos)
          .where(and(eq(photos.id, input.photoId), eq(photos.userId, ctx.user.id)))
          .limit(1);

        if (!photo) {
          throw new Error(getServerString("photoNotFound"));
        }

        // Toggle favorite
        await db
          .update(photos)
          .set({ isFavorite: !photo.isFavorite })
          .where(eq(photos.id, input.photoId));

        return { success: true, isFavorite: !photo.isFavorite };
      }),
    delete: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error(getServerString("databaseNotAvailable"));

        // Verify ownership
        const [photo] = await db
          .select()
          .from(photos)
          .where(and(eq(photos.id, input.photoId), eq(photos.userId, ctx.user.id)))
          .limit(1);

        if (!photo) {
          throw new Error(getServerString("photoNotFound"));
        }

        // Delete photo
        await db.delete(photos).where(eq(photos.id, input.photoId));

        return { success: true };
      }),
    deleteMany: protectedProcedure
      .input(z.object({ photoIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error(getServerString("databaseNotAvailable"));

        if (input.photoIds.length === 0) {
          return { success: true };
        }

        // Delete photos (only user's own)
        await db
          .delete(photos)
          .where(and(
            eq(photos.userId, ctx.user.id),
            inArray(photos.id, input.photoIds)
          ));

        return { success: true };
      }),
    incrementDownload: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error(getServerString("databaseNotAvailable"));

        // Verify ownership and increment download count
        const [photo] = await db
          .select()
          .from(photos)
          .where(and(eq(photos.id, input.photoId), eq(photos.userId, ctx.user.id)))
          .limit(1);

        if (!photo) {
          throw new Error(getServerString("photoNotFound"));
        }

        await db
          .update(photos)
          .set({ downloadCount: (photo.downloadCount || 0) + 1 })
          .where(eq(photos.id, input.photoId));

        return { success: true };
      }),
  }),
  support: router({
    reportBug: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(5000),
        stepsToReproduce: z.string().max(2000).optional(),
        expectedBehavior: z.string().max(1000).optional(),
        actualBehavior: z.string().max(1000).optional(),
        browserInfo: z.string().max(500).optional(),
        deviceInfo: z.string().max(500).optional(),
        screenshotUrl: z.string().url().optional().or(z.literal("")),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        // Get browser and device info if not provided
        const browserInfo = input.browserInfo || "Unknown";
        const deviceInfo = input.deviceInfo || "Unknown";

        try {
          if (db) {
            // Use direct DB connection
            const [bugReport] = await db
              .insert(bugReports)
              .values({
                userId: ctx.user.id,
                title: input.title,
                description: input.description,
                stepsToReproduce: input.stepsToReproduce || null,
                expectedBehavior: input.expectedBehavior || null,
                actualBehavior: input.actualBehavior || null,
                browserInfo: browserInfo,
                deviceInfo: deviceInfo,
                screenshotUrl: input.screenshotUrl || null,
                status: "open",
                priority: "medium",
              })
              .returning();

            return { success: true, id: bugReport.id };
          } else {
            // Fallback to Supabase REST API
            const { data, error } = await supabaseServer
              .from("bug_reports")
              .insert({
                userId: ctx.user.id,
                title: input.title,
                description: input.description,
                steps_to_reproduce: input.stepsToReproduce || null,
                expected_behavior: input.expectedBehavior || null,
                actual_behavior: input.actualBehavior || null,
                browser_info: browserInfo,
                device_info: deviceInfo,
                screenshot_url: input.screenshotUrl || null,
                status: "open",
                priority: "medium",
              })
              .select()
              .single();

            if (error) throw error;
            return { success: true, id: data.id };
          }
        } catch (error: any) {
          console.error("[Support] Error creating bug report:", error);
          throw new Error(error?.message || "Failed to create bug report");
        }
      }),

    suggestFeature: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(5000),
        useCase: z.string().max(2000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        try {
          if (db) {
            // Use direct DB connection
            const [featureSuggestion] = await db
              .insert(featureSuggestions)
              .values({
                userId: ctx.user.id,
                title: input.title,
                description: input.description,
                useCase: input.useCase || null,
                priority: "medium",
                status: "open",
                upvotes: 0,
              })
              .returning();

            return { success: true, id: featureSuggestion.id };
          } else {
            // Fallback to Supabase REST API
            const { data, error } = await supabaseServer
              .from("feature_suggestions")
              .insert({
                userId: ctx.user.id,
                title: input.title,
                description: input.description,
                use_case: input.useCase || null,
                priority: "medium",
                status: "open",
                upvotes: 0,
              })
              .select()
              .single();

            if (error) throw error;
            return { success: true, id: data.id };
          }
        } catch (error: any) {
          console.error("[Support] Error creating feature suggestion:", error);
          throw new Error(error?.message || "Failed to create feature suggestion");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
