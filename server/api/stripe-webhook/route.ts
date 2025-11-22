import express from "express";
import { stripe } from "../../_core/stripe.js";
import { getDb } from "../../db.js";
import { eq } from "drizzle-orm";
import { transactions, users, creditPacks } from "../../../drizzle/schema.js";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const router = express.Router();

// Stripe webhook requires raw body for signature verification
// Note: express.raw() is applied in server/_core/index.ts before express.json()
router.post("/", async (req, res) => {
  console.log("[Stripe Webhook] Received request at /api/stripe-webhook");
  console.log("[Stripe Webhook] Method:", req.method);
  console.log("[Stripe Webhook] Headers:", JSON.stringify(req.headers, null, 2));
  
  const body = req.body as Buffer;
  const signature = req.headers["stripe-signature"] as string;
  
  console.log("[Stripe Webhook] Body type:", typeof body);
  console.log("[Stripe Webhook] Body is Buffer:", Buffer.isBuffer(body));

  if (!signature) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set in environment variables");
    console.error("[Stripe Webhook] Get your webhook secret from Stripe Dashboard -> Webhooks -> Your endpoint -> Signing secret");
    return res.status(500).json({ error: "Webhook secret not configured. Set STRIPE_WEBHOOK_SECRET in .env" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    console.error("[Stripe Webhook] Make sure STRIPE_WEBHOOK_SECRET matches the secret from Stripe Dashboard");
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log("[Stripe Webhook] Received event:", event.type);

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    
    const userId = parseInt(session.metadata?.userId || session.client_reference_id || "0");
    const packId = parseInt(session.metadata?.packId || "0");
    const credits = parseInt(session.metadata?.credits || "0");

    if (!userId || !packId || !credits) {
      console.error("[Stripe Webhook] Missing metadata:", { userId, packId, credits });
      return res.status(400).json({ error: "Missing required metadata" });
    }

    const db = await getDb();
    if (!db) {
      console.error("[Stripe Webhook] Database not available");
      return res.status(500).json({ error: "Database not available" });
    }

    try {
      // Update transaction status
      await db
        .update(transactions)
        .set({ 
          status: "completed",
          stripePaymentId: session.id,
          creditsAwarded: credits,
        })
        .where(eq(transactions.stripePaymentId, session.id));

      // Add credits to user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user) {
        await db
          .update(users)
          .set({ credits: (user.credits || 0) + credits })
          .where(eq(users.id, userId));
        
        console.log(`[Stripe Webhook] Added ${credits} credits to user ${userId}`);
      } else {
        console.error(`[Stripe Webhook] User ${userId} not found`);
      }
    } catch (error: any) {
      console.error("[Stripe Webhook] Error processing payment:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.json({ received: true });
});

export default router;

