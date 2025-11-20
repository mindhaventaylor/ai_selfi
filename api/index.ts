// Vercel serverless function entry point
// Set Vercel environment variable so the Express app knows it's running on Vercel
process.env.VERCEL = "1";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

const appPromise = (async () => {
  try {
    console.log("[Vercel] Initializing Express app...");

    const serverModule: any = await import("../dist/index.js");

    const createApp = serverModule.createApp || serverModule.default;
    if (typeof createApp !== "function") {
      throw new Error(`createApp is not a function. Got: ${typeof createApp}`);
    }

    const app = createApp();
    console.log("[Vercel] Express app initialized successfully");
    return app;
  } catch (error: any) {
    console.error("[Vercel] Failed to initialize Express app");
    console.error("[Vercel] Error:", error?.message);
    console.error("[Vercel] Stack:", error?.stack);

    const { default: express } = await import("express");
    const fallback = express();
    fallback.use((_req: any, res: any) => {
      console.error("[Vercel] Request received but app failed to initialize");
      res.status(500).json({
        error: "Server initialization failed",
        message: error?.message || "Unknown error",
        ...(process.env.NODE_ENV === "development" && { stack: error?.stack }),
      });
    });
    return fallback;
  }
})();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}

