// Vercel serverless function entry point
// Set Vercel environment variable so the Express app knows it's running on Vercel
process.env.VERCEL = "1";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Import the Express app from the built dist folder
// Vercel will compile this TypeScript file, so we need to import from the source
// but the actual runtime will use the built version
let app: any;

try {
  // Try to import from source (will be compiled by Vercel)
  const { createApp } = require("../server/_core/index");
  app = createApp();
  console.log("[Vercel] Express app created successfully");
} catch (error: any) {
  console.error("[Vercel] Failed to create Express app:", error);
  console.error("[Vercel] Error stack:", error?.stack);
  
  // Create a minimal error handler app
  const express = require("express");
  app = express();
  app.use((req: any, res: any) => {
    console.error("[Vercel] Express app initialization failed, returning error");
    res.status(500).json({ 
      error: "Server initialization failed",
      message: error?.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
    });
  });
}

// Export the Express app for Vercel
export default app;

