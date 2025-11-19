// Vercel serverless function entry point
// Set Vercel environment variable so the Express app knows it's running on Vercel
process.env.VERCEL = "1";

// Import the Express app from source - Vercel will compile TypeScript
import { createApp } from "../server/_core/index.js";

const app = createApp();

export default app;

