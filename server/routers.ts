import { COOKIE_NAME } from "@shared/const";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { creditPacks, models, photos, transactions, users } from "../drizzle/schema";
import { getDb, upsertUser } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { supabaseServer } from "./_core/lib/supabase";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

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
            const errorMsg = "Supabase not configured: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY";
            console.error("[Auth]", errorMsg);
            throw new Error(errorMsg);
          }

          // Verify Supabase session and sync user
          const { data: { user }, error } = await supabaseServer.auth.getUser(input.accessToken);
          
          if (error) {
            console.error("[Auth] Token verification error:", {
              message: error.message,
              status: error.status,
              name: error.name,
            });
            // Include the error message in a way that will be visible to the client
            const errorMsg = error.message || "Unknown error";
            throw new Error(`Token verification failed: ${errorMsg}`);
          }
          
          if (!user) {
            console.error("[Auth] No user returned from token verification");
            throw new Error("Invalid access token: no user found");
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
            throw new Error("Server configuration error. Please contact support.");
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
        if (!db) throw new Error("Database not available");
        
        const packResult = await db.select().from(creditPacks).where(eq(creditPacks.id, input.packId)).limit(1);
        const pack = packResult[0];

        if (!pack) throw new Error("Pack not found");

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
      if (!db) return [];
      return db
        .select()
        .from(models)
        .where(eq(models.userId, ctx.user.id))
        .orderBy(desc(models.createdAt));
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string(), triggerWord: z.string(), trainingDataUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db.insert(models).values({
          userId: ctx.user.id,
          name: input.name,
          triggerWord: input.triggerWord,
          trainingDataUrl: input.trainingDataUrl,
          status: "training",
        });
        return { success: true };
      }),
  }),
  photo: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(photos)
        .where(eq(photos.userId, ctx.user.id))
        .orderBy(desc(photos.createdAt));
    }),
    create: protectedProcedure
      .input(z.object({ modelId: z.number(), style: z.string(), prompt: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check credits
        if ((ctx.user.credits || 0) < 1) {
           throw new Error("Insufficient credits");
        }

        // Deduct credit
        await db
          .update(users)
          .set({ credits: (ctx.user.credits || 0) - 1 })
          .where(eq(users.id, ctx.user.id));

        // Create photo record
        await db.insert(photos).values({
          userId: ctx.user.id,
          modelId: input.modelId,
          style: input.style,
          prompt: input.prompt,
          status: "generating",
          url: "https://placehold.co/1024x1024?text=Generating...", // Placeholder
        });

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
