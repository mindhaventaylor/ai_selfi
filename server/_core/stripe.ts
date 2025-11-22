import Stripe from "stripe";
import { ENV } from "./env.js";

if (!ENV.stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2024-12-18.acacia",
});

export type StripePrice = {
  id: string;
  amount: number;
  currency: string;
  credits: number;
};

// Common credit pack prices (you can customize these)
export const CREDIT_PACKS: StripePrice[] = [
  {
    id: "credits_10",
    amount: 999, // $9.99 in cents
    currency: "usd",
    credits: 10,
  },
  {
    id: "credits_25",
    amount: 1999, // $19.99 in cents
    currency: "usd",
    credits: 25,
  },
  {
    id: "credits_50",
    amount: 3499, // $34.99 in cents
    currency: "usd",
    credits: 50,
  },
  {
    id: "credits_100",
    amount: 5999, // $59.99 in cents
    currency: "usd",
    credits: 100,
  },
];

