import { COOKIE_NAME } from "@shared/const";
import { desc, eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { creditPacks, models, photos, transactions, users, modelTrainingImages, photoGenerationBatches } from "../drizzle/schema";
import { getDb, upsertUser } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { supabaseServer } from "./_core/lib/supabase";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { generateImagesWithGemini } from "./_core/gemini";
import { getServerString } from "./_core/strings";

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
          const cookieOptions = getSessionCookieOptions(ctx.req);
          const sessionData = {
            access_token: input.accessToken,
          };
          const cookieValue = Buffer.from(JSON.stringify(sessionData)).toString("base64");
          const PROJECT_REF = "gxwtcdplfkjfidwyrunk";
          const AUTH_COOKIE_NAME = `sb-${PROJECT_REF}-auth-token`;
          ctx.res.cookie(AUTH_COOKIE_NAME, cookieValue, { 
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
      const cookieOptions = getSessionCookieOptions(ctx.req);
      const PROJECT_REF = "gxwtcdplfkjfidwyrunk";
      const AUTH_COOKIE_NAME = `sb-${PROJECT_REF}-auth-token`;
      
      // Clear both the old cookie name and the Supabase auth cookie
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(AUTH_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      
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

          // Simulate training: Update status to "ready" after random delay (20-40 seconds)
          if (modelData) {
            const trainingDelay = Math.floor(Math.random() * 20000) + 20000; // 20-40 seconds in milliseconds
            
            setTimeout(async () => {
              try {
                await supabaseServer
                  .from('models')
                  .update({ status: "ready" })
                  .eq('id', modelData.id);
                console.log(`[Model Training] Model ${modelData.id} training completed`);
              } catch (error) {
                console.error(`[Model Training] Error updating model ${modelData.id} status:`, error);
                // Try to set status to "failed" if update fails
                try {
                  await supabaseServer
                    .from('models')
                    .update({ status: "failed" })
                    .eq('id', modelData.id);
                } catch (failError) {
                  console.error(`[Model Training] Error setting model ${modelData.id} to failed:`, failError);
                }
              }
            }, trainingDelay);
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

        // Simulate training: Update status to "ready" after random delay (20-40 seconds)
        if (model) {
          const trainingDelay = Math.floor(Math.random() * 20000) + 20000; // 20-40 seconds in milliseconds
          
          setTimeout(async () => {
            try {
              const updateDb = await getDb();
              if (updateDb) {
                await updateDb
                  .update(models)
                  .set({ status: "ready" })
                  .where(eq(models.id, model.id));
              } else {
                // Fallback to REST API
                await supabaseServer
                  .from('models')
                  .update({ status: "ready" })
                  .eq('id', model.id);
              }
              console.log(`[Model Training] Model ${model.id} training completed`);
            } catch (error) {
              console.error(`[Model Training] Error updating model ${model.id} status:`, error);
              // Try to set status to "failed" if update fails
              try {
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
              } catch (failError) {
                console.error(`[Model Training] Error setting model ${model.id} to failed:`, failError);
              }
            }
          }, trainingDelay);
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
        referenceImageUrls: z.array(z.string()).min(1),
        aspectRatio: z.enum(["1:1", "9:16", "16:9"]),
        glasses: z.enum(["yes", "no"]),
        hairColor: z.string().optional(),
        hairStyle: z.string().optional(),
        backgrounds: z.array(z.string()).default([]),
        styles: z.array(z.string()).default([]),
        numImagesPerReference: z.number().default(4),
        totalImagesToGenerate: z.number().optional(), // Frontend-calculated total (based on selected example images only)
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        
        // Use frontend-calculated total if provided, otherwise fall back to old calculation
        // The frontend calculates this based on selected example images only (not training images)
        const totalImages = input.totalImagesToGenerate ?? (input.referenceImageUrls.length * input.numImagesPerReference);
        const creditsNeeded = totalImages;
        
        console.log(`[Photo Generate] Total images to generate: ${totalImages}, Credits needed: ${creditsNeeded}, Reference images: ${input.referenceImageUrls.length}`);

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

        // Fetch reference images and convert to base64
        // For private buckets, we need to download directly from Supabase Storage using service role
        console.log(`\n${'='.repeat(80)}`);
        console.log(`[Photo Generate] 📥 Fetching ${input.referenceImageUrls.length} reference image(s)`);
        console.log(`${'='.repeat(80)}\n`);
        
        const referenceImages = await Promise.all(
          input.referenceImageUrls.map(async (url, index) => {
            try {
              console.log(`[Image Fetch] 🔍 [${index + 1}/${input.referenceImageUrls.length}] Processing: ${url.substring(0, 80)}...`);
              
              // Check if this is a Supabase Storage URL
              // Pattern: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
              // Or: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?[params]
              // Split the URL to extract bucket and path more reliably
              const storageIndex = url.indexOf('/storage/v1/object/');
              if (storageIndex !== -1) {
                const afterStorage = url.substring(storageIndex + '/storage/v1/object/'.length);
                // After '/storage/v1/object/' we have either 'public/[bucket]/[path]' or 'sign/[bucket]/[path]'
                const parts = afterStorage.split('/');
                if (parts.length >= 3 && (parts[0] === 'public' || parts[0] === 'sign')) {
                  const bucketName = parts[1];
                  const filePath = parts.slice(2).join('/'); // Rejoin the rest as the file path
              
                  // Remove query parameters if present
                  let cleanPath = filePath;
                  const queryIndex = cleanPath.indexOf('?');
                  if (queryIndex !== -1) {
                    cleanPath = cleanPath.substring(0, queryIndex);
                  }
                  const decodedPath = decodeURIComponent(cleanPath);
                
                  console.log(`[Image Fetch] ✅ [${index + 1}] Detected Supabase Storage - Bucket: ${bucketName}, Path: ${decodedPath}`);
                  
                  // Download directly from Supabase Storage using service role (bypasses RLS)
                  const { data, error } = await supabaseServer.storage
                    .from(bucketName)
                    .download(decodedPath);
                
                  if (error) {
                    console.error(`[Image Fetch] ❌ [${index + 1}] Supabase download error:`, error);
                    throw new Error(`${getServerString("failedToDownloadImage")}: ${error.message}`);
                  }
                  
                  if (!data) {
                    console.error(`[Image Fetch] ❌ [${index + 1}] No data returned from Supabase`);
                    throw new Error(getServerString("noDataReturned"));
                  }
                  
                  // Convert blob to buffer
                  const arrayBuffer = await data.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  const base64 = buffer.toString("base64");
                  
                  // Determine mime type from file extension or default
                  let contentType = "image/jpeg";
                  const lowerPath = decodedPath.toLowerCase();
                  if (lowerPath.endsWith('.png')) contentType = "image/png";
                  else if (lowerPath.endsWith('.webp')) contentType = "image/webp";
                  else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) contentType = "image/jpeg";
                  
                  const imageSizeKB = Math.round(buffer.length / 1024);
                  const base64SizeKB = Math.round(base64.length * 0.75 / 1024);
                  console.log(`[Image Fetch] ✅ [${index + 1}] Successfully downloaded: ${imageSizeKB}KB (base64: ~${base64SizeKB}KB), type: ${contentType}`);
                  
                  return {
                    data: base64,
                    mimeType: contentType,
                  };
                }
              }
              
              // Not a Supabase Storage URL, try regular HTTP fetch
              console.log(`[Image Fetch] 🌐 [${index + 1}] Not a Supabase URL, trying HTTP fetch: ${url}`);
              const response = await fetch(url);
              
              if (!response.ok) {
                console.error(`[Image Fetch] ❌ [${index + 1}] HTTP fetch failed: ${response.status} ${response.statusText}`);
                throw new Error(`${getServerString("failedToFetchImage")}: ${url} (${response.status} ${response.statusText})`);
              }
              
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const base64 = buffer.toString("base64");
              
              const contentType = response.headers.get("content-type") || "image/jpeg";
              const imageSizeKB = Math.round(buffer.length / 1024);
              const base64SizeKB = Math.round(base64.length * 0.75 / 1024);
              
              console.log(`[Image Fetch] ✅ [${index + 1}] Successfully fetched via HTTP: ${imageSizeKB}KB (base64: ~${base64SizeKB}KB), type: ${contentType}`);
              
              return {
                data: base64,
                mimeType: contentType,
              };
            } catch (error) {
              console.error(`[Image Fetch] ❌ [${index + 1}] Error fetching reference image:`, error);
              throw new Error(`${getServerString("failedToFetchReferenceImage")}: ${url}. ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          })
        );
        
        console.log(`\n[Photo Generate] ✅ Successfully fetched ${referenceImages.length} reference image(s)\n`);

        // Build prompt from selected options
        let prompt = `Create a photorealistic professional portrait image of the person in the reference photos.`;
        
        if (input.backgrounds.length > 0) {
          prompt += ` Use a ${input.backgrounds.join(", ")} background.`;
        }
        
        if (input.styles.length > 0) {
          prompt += ` Style: ${input.styles.join(", ")}.`;
        }
        
        if (input.glasses === "yes") {
          prompt += ` Include glasses.`;
        }
        
        if (input.hairColor && input.hairColor !== "default") {
          prompt += ` Hair color: ${input.hairColor}.`;
        }
        
        if (input.hairStyle && input.hairStyle !== "no-preference") {
          prompt += ` Hair style: ${input.hairStyle}.`;
        }
        
        prompt += ` High quality, professional photography, natural lighting, sharp focus.`;

        // Generate images using Gemini API
        // Note: Rate limiting may occur - the API will retry automatically
        let generatedImages;
        try {
          console.log(`\n${'='.repeat(80)}`);
          console.log(`[Photo Generate] 🚀 Starting image generation process`);
          console.log(`[Photo Generate]    - User ID: ${ctx.user.id}`);
          console.log(`[Photo Generate]    - Model ID: ${input.modelId}`);
          console.log(`[Photo Generate]    - Reference images: ${referenceImages.length}`);
          console.log(`[Photo Generate]    - Target images: ${totalImages}`);
          console.log(`[Photo Generate]    - Aspect ratio: ${input.aspectRatio}`);
          console.log(`[Photo Generate]    - Prompt: ${prompt.substring(0, 100)}...`);
          console.log(`${'='.repeat(80)}\n`);
          
          generatedImages = await generateImagesWithGemini({
            referenceImages,
            prompt,
            aspectRatio: input.aspectRatio,
            numImages: totalImages,
          });
          
          console.log(`\n${'='.repeat(80)}`);
          console.log(`[Photo Generate] ✅ Gemini API returned ${generatedImages.length} image(s)`);
          console.log(`${'='.repeat(80)}\n`);
          
          if (generatedImages.length === 0) {
            throw new Error(getServerString("noImagesGenerated"));
          }
          
          if (generatedImages.length < totalImages) {
            console.warn(`[Photo Generate] Warning: Requested ${totalImages} images but only received ${generatedImages.length}`);
          }
        } catch (error) {
          console.error(`[Photo Generate] Error generating images:`, error);
          // Provide user-friendly error message for rate limits
          if (error instanceof Error && (error.message.includes('rate limit') || error.message.includes('429'))) {
            throw new Error(getServerString("highDemandRetry"));
          }
          // Provide more specific error messages
          if (error instanceof Error) {
            throw new Error(`${getServerString("failedToGenerateImages")}: ${error.message}`);
          }
          throw error;
        }

        // Upload generated images to Supabase Storage
        console.log(`\n${'='.repeat(80)}`);
        console.log(`[Photo Generate] 📤 Starting upload to Supabase Storage`);
        console.log(`[Photo Generate]    - Images to upload: ${generatedImages.length}`);
        console.log(`${'='.repeat(80)}\n`);
        
        const uploadedUrls: string[] = [];
        const baseTimestamp = Date.now();
        
        for (let i = 0; i < generatedImages.length; i++) {
          const image = generatedImages[i];
          
          // Validate image data
          if (!image.data || image.data.length === 0) {
            console.error(`[Photo Generate] ❌ Invalid image data at index ${i} - skipping`);
            continue; // Skip invalid images
          }
          
          try {
            const imageBuffer = Buffer.from(image.data, "base64");
            
            // Validate buffer
            if (imageBuffer.length === 0) {
              console.error(`[Photo Generate] ❌ Empty buffer at index ${i} - skipping`);
              continue;
            }
            
            const fileName = `generated/${ctx.user.id}/${baseTimestamp}-${i}.png`;
            const imageSizeKB = Math.round(imageBuffer.length / 1024);
            
            console.log(`[Photo Generate] 📤 Uploading image ${i + 1}/${generatedImages.length}: ${fileName} (${imageSizeKB}KB, ${image.mimeType})`);
            
            const { data: uploadData, error: uploadError } = await supabaseServer.storage
              .from("generated-photos")
              .upload(fileName, imageBuffer, {
                contentType: image.mimeType || "image/png",
                upsert: false,
              });

            if (uploadError) {
              console.error(`[Photo Generate] ❌ Upload failed for image ${i + 1}:`, uploadError);
              throw new Error(`${getServerString("failedToUploadGeneratedImage")} ${i + 1}: ${uploadError.message}`);
            }

            // Get public URL
            const { data: urlData } = supabaseServer.storage
              .from("generated-photos")
              .getPublicUrl(fileName);

            uploadedUrls.push(urlData.publicUrl);
            console.log(`[Photo Generate] ✅ Successfully uploaded image ${i + 1}: ${urlData.publicUrl}`);
          } catch (error) {
            console.error(`[Photo Generate] ❌ Error processing image ${i + 1}:`, error);
            // Continue with other images instead of failing completely
            if (uploadedUrls.length === 0) {
              throw error; // Only throw if no images were uploaded at all
            }
          }
        }
        
        if (uploadedUrls.length === 0) {
          console.error(`[Photo Generate] ❌ Failed to upload any images`);
          throw new Error(getServerString("failedToUploadAnyImages"));
        }
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`[Photo Generate] ✅ Upload complete: ${uploadedUrls.length}/${generatedImages.length} images uploaded`);
        console.log(`${'='.repeat(80)}\n`);

        // Create generation batch and photo records
        let batchId: number | undefined;
        
        if (!db) {
          // Use REST API
          // Create generation batch
          const { data: batchData, error: batchError } = await supabaseServer
            .from('photo_generation_batches')
            .insert({
              userId: ctx.user.id,
              modelId: input.modelId,
              totalImagesGenerated: uploadedUrls.length,
              creditsUsed: creditsNeeded,
              aspectRatio: input.aspectRatio,
              glasses: input.glasses,
              hairColor: input.hairColor || null,
              hairStyle: input.hairStyle || null,
              backgrounds: input.backgrounds,
              styles: input.styles,
              status: "completed",
              completedAt: new Date().toISOString(),
            })
            .select()
            .single();

          if (batchError) {
            throw new Error(`${getServerString("failedToCreateGenerationBatch")}: ${batchError.message}`);
          }

          batchId = batchData?.id;

          // Create photo records for gallery
          const photoRecords = uploadedUrls.map((url, index) => ({
            userId: ctx.user.id,
            modelId: input.modelId,
            generationBatchId: batchId,
            url: url,
            status: "completed",
            creditsUsed: 1,
            aspectRatio: input.aspectRatio,
            glasses: input.glasses,
            hairColor: input.hairColor || null,
            hairStyle: input.hairStyle || null,
            backgrounds: input.backgrounds,
            styles: input.styles,
            prompt: prompt, // Save the prompt used for generation
          }));

          console.log(`\n${'='.repeat(80)}`);
          console.log(`[Photo Generate] 📸 Adding ${photoRecords.length} photo(s) to gallery`);
          console.log(`${'='.repeat(80)}\n`);

          const { data: insertedPhotos, error: photosError } = await supabaseServer
            .from('photos')
            .insert(photoRecords)
            .select();

          if (photosError) {
            console.error(`[Photo Generate] ❌ Failed to add photos to gallery:`, photosError);
            throw new Error(`${getServerString("failedToCreatePhotoRecords")}: ${photosError.message}`);
          }

          console.log(`[Photo Generate] ✅ Successfully added ${insertedPhotos?.length || photoRecords.length} photo(s) to gallery`);
          if (insertedPhotos && insertedPhotos.length > 0) {
            insertedPhotos.forEach((photo: any, index: number) => {
              console.log(`[Photo Generate]    Photo ${index + 1}: ID=${photo.id}, URL=${photo.url}`);
            });
          }

          // Deduct credits
          const { error: creditsError } = await supabaseServer
            .from('users')
            .update({ credits: (ctx.user.credits || 0) - creditsNeeded })
            .eq('id', ctx.user.id);

          if (creditsError) {
            throw new Error(`${getServerString("failedToDeductCredits")}: ${creditsError.message}`);
          }
        } else {
          // Use direct database connection
          // Create generation batch
          const [batch] = await db.insert(photoGenerationBatches).values({
            userId: ctx.user.id,
            modelId: input.modelId,
            totalImagesGenerated: uploadedUrls.length,
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

          batchId = batch?.id;

          // Create photo records for gallery
          const photoRecords = uploadedUrls.map((url) => ({
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
            prompt: prompt, // Save the prompt used for generation
          }));

          console.log(`\n${'='.repeat(80)}`);
          console.log(`[Photo Generate] 📸 Adding ${photoRecords.length} photo(s) to gallery`);
          console.log(`${'='.repeat(80)}\n`);

          const insertedPhotos = await db.insert(photos).values(photoRecords).returning();

          console.log(`[Photo Generate] ✅ Successfully added ${insertedPhotos.length} photo(s) to gallery`);
          insertedPhotos.forEach((photo, index) => {
            console.log(`[Photo Generate]    Photo ${index + 1}: ID=${photo.id}, URL=${photo.url}`);
          });

          // Deduct credits
          await db
            .update(users)
            .set({ credits: (ctx.user.credits || 0) - creditsNeeded })
            .where(eq(users.id, ctx.user.id));
        }

        return { 
          success: true, 
          batchId: batchId,
          imageUrls: uploadedUrls,
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
