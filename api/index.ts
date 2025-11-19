// Vercel serverless function entry point
// Set Vercel environment variable so the Express app knows it's running on Vercel
process.env.VERCEL = "1";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Import the Express app factory
import { createApp } from "../server/_core/index";

// Create the app instance
const app = createApp();

// Export the Express app for Vercel
export default app;

