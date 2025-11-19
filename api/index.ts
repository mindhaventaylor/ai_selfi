// Vercel serverless function entry point
// Set Vercel environment variable so the Express app knows it's running on Vercel
process.env.VERCEL = "1";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Import and create the Express app
// Using require to avoid ESM/TypeScript compilation issues
let app: any;

try {
  console.log("[Vercel] Initializing Express app...");
  
  // Import the createApp function
  // Try both source and dist paths since Vercel compiles TypeScript
  let serverModule;
  try {
    // First try the source path (Vercel will compile it)
    serverModule = require("../server/_core/index");
  } catch (e) {
    // Fallback to dist if source doesn't work
    serverModule = require("../../dist/index.js");
  }
  
  const createApp = serverModule.createApp || serverModule.default;
  
  if (typeof createApp !== "function") {
    throw new Error(`createApp is not a function. Got: ${typeof createApp}`);
  }
  
  app = createApp();
  console.log("[Vercel] Express app initialized successfully");
} catch (error: any) {
  console.error("[Vercel] Failed to initialize Express app");
  console.error("[Vercel] Error:", error?.message);
  console.error("[Vercel] Stack:", error?.stack);
  
  // Fallback: Create a minimal Express app that shows the error
  const express = require("express");
  app = express();
  
  app.use((req: any, res: any) => {
    console.error("[Vercel] Request received but app failed to initialize");
    res.status(500).json({
      error: "Server initialization failed",
      message: error?.message || "Unknown error",
      // Only show stack in development
      ...(process.env.NODE_ENV === "development" && { stack: error?.stack })
    });
  });
}

// Export the Express app for Vercel
export default app;

