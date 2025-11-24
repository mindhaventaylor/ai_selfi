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
  try {
  const app = await appPromise;
    
    // Wrap the app handler to catch any errors
    return new Promise<void>((resolve) => {
      const originalEnd = res.end.bind(res);
      let errorHandled = false;

      res.end = function(...args: any[]) {
        if (!errorHandled) {
          errorHandled = true;
        }
        originalEnd(...args);
        resolve();
      };

      app(req, res, (err: any) => {
        if (err && !errorHandled) {
          errorHandled = true;
          console.error("[Vercel Handler] Error in request:", {
            error: err?.message,
            stack: err?.stack,
            path: req.path,
            method: req.method,
          });

          // If it's an API route, return JSON
          if (req.path?.startsWith("/api/")) {
            res.status(err?.status || 500).json({
              error: err?.message || "Internal server error",
            });
          } else {
            // For non-API routes, try to return a basic HTML page
            res.status(200).setHeader("Content-Type", "text/html").send(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Loading...</title>
                  <meta charset="UTF-8">
                  <meta http-equiv="refresh" content="2">
                </head>
                <body>
                  <h1>Loading...</h1>
                  <p>Please wait while the page loads.</p>
                </body>
              </html>
            `);
          }
          resolve();
        }
      });
    });
  } catch (error: any) {
    console.error("[Vercel Handler] Fatal error:", {
      error: error?.message,
      stack: error?.stack,
      path: req?.path,
    });

    // Always return something, never leave blank
    if (req?.path?.startsWith("/api/")) {
      return res.status(500).json({
        error: "Internal server error",
        message: error?.message || "Unknown error",
      });
    }

    return res.status(200).setHeader("Content-Type", "text/html").send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Server Error</h1>
          <p>An error occurred. Please try again later.</p>
        </body>
      </html>
    `);
  }
}

