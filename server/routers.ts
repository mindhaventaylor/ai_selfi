import { COOKIE_NAME } from "../shared/const.js";
import { desc, eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { creditPacks, models, photos, transactions, users, modelTrainingImages, photoGenerationBatches, photoGenerationQueue } from "../drizzle/schema.js";
import { getDb, upsertUser } from "./db.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { supabaseServer } from "./_core/lib/supabase.js";
import { systemRouter } from "./_core/systemRouter.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import { generateImagesWithGemini } from "./_core/gemini.js";
import { getServerString } from "./_core/strings.js";
import { ENV } from "./_core/env.js";
import { stripe, CREDIT_PACKS } from "./_core/stripe.js";

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
  
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
      "apikey": supabaseServiceKey,
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Edge Function ${functionName} failed: ${response.status} ${errorText}`
    );
  }
  
  return await response.json();
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
      .input(z.object({ packId: z.number() }))
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

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${pack.credits} Credits`,
                  description: `Purchase ${pack.credits} credits for AI image generation`,
                },
                unit_amount: Math.round(parseFloat(pack.price.toString()) * 100), // Convert to cents
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

          // Call Edge Function for async training (runs even if site is down)
          if (modelData) {
            try {
              console.log(`[Model Training] Calling Edge Function for model ${modelData.id}`);
              
              // Call Edge Function asynchronously (don't await - let it run in background)
              callSupabaseFunction("train-model", {
                modelId: modelData.id,
                userId: ctx.user.id,
                trainingImageUrls: input.trainingImageUrls,
            }).catch(async (error) => {
              console.error(`[Model Training] Edge Function error for model ${modelData.id}:`, error);
              // Try to set status to "failed" if Edge Function fails
              try {
                await supabaseServer
                  .from('models')
                  .update({ status: "failed" })
                  .eq('id', modelData.id);
              } catch (failError: any) {
                console.error(`[Model Training] Error setting model ${modelData.id} to failed:`, failError);
              }
            });
              
              console.log(`[Model Training] Edge Function called for model ${modelData.id} (processing asynchronously)`);
              } catch (error) {
              console.error(`[Model Training] Error calling Edge Function for model ${modelData.id}:`, error);
              // Set status to "failed" if we can't even call the Edge Function
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

        // Call Edge Function for async training (runs even if site is down)
        if (model) {
          try {
            console.log(`[Model Training] Calling Edge Function for model ${model.id}`);
            
            // Call Edge Function asynchronously (don't await - let it run in background)
            callSupabaseFunction("train-model", {
              modelId: model.id,
              userId: ctx.user.id,
              trainingImageUrls: input.trainingImageUrls,
            }).catch(async (error) => {
              console.error(`[Model Training] Edge Function error for model ${model.id}:`, error);
              // Try to set status to "failed" if Edge Function fails
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
                  if (updateError) throw updateError;
                }
              } catch (failError: any) {
                console.error(`[Model Training] Error setting model ${model.id} to failed:`, failError);
              }
            });
            
            console.log(`[Model Training] Edge Function called for model ${model.id} (processing asynchronously)`);
            } catch (error) {
            console.error(`[Model Training] Error calling Edge Function for model ${model.id}:`, error);
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
        modelId: z.number(),
        trainingImageUrls: z.array(z.string()).min(1), // Model's training images
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

        // Use Supabase REST API if direct DB connection is not available
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

        // No need to fetch images here - Edge Function will handle it
        console.log(`\n${'='.repeat(80)}`);
        console.log(`[Photo Generate] 📥 Preparing batch with ${input.trainingImageUrls.length} training image(s) and ${input.exampleImages.length} example image(s)`);
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
              modelId: input.modelId,
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
            modelId: input.modelId,
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
          modelId: input.modelId,
          exampleImageId: example.id,
          exampleImageUrl: example.url,
          exampleImagePrompt: example.prompt,
          trainingImageUrls: input.trainingImageUrls,
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
        
        for (const job of insertedJobs) {
          // Call API asynchronously (don't block the response)
          fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(job),
          })
            .then((response) => {
              if (!response.ok) {
                console.error(`[Photo Generate] API error for job ${job.id}: ${response.status}`);
              } else {
                console.log(`[Photo Generate] ✅ API processing started for job ${job.id}`);
              }
            })
            .catch((error) => {
              console.error(`[Photo Generate] Failed to trigger API for job ${job.id}:`, error);
            });
        }
        
        console.log(`[Photo Generate] 🚀 Triggered API processing for ${insertedJobs.length} job(s)`);

        return {
          success: true,
          batchId,
          message: "Image generation jobs queued. Processing will happen shortly.",
        };
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
});

export type AppRouter = typeof appRouter;
