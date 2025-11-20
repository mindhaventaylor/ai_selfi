import "dotenv/config";
import express from "express";
import { createServer, type Server } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth.js";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";

// Simple static file server for production (no Vite dependencies)
function serveStaticProduction(app: express.Express) {
  const expressApp = app as any;
  // On Vercel, static files are served by Vercel itself, not Express
  // We only need to handle the SPA fallback (serve index.html for non-API routes)
  if (process.env.VERCEL === "1") {
    // On Vercel, only handle SPA fallback for non-API routes
    expressApp.use("*", (req: any, res: any, next: any) => {
      // Skip API routes - they're handled by Express
      if (req.path.startsWith("/api/")) {
        return next();
      }
      
      // For SPA routes, try to serve index.html
      const possiblePaths = [
        path.resolve(process.cwd(), "dist", "public", "index.html"),
        path.resolve(process.cwd(), "public", "index.html"),
      ];
      
      for (const indexPath of possiblePaths) {
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }
      
      // If index.html not found, let Vercel handle it (it will serve static files)
      next();
    });
    return;
  }

  // In production (non-Vercel), serve static files normally
  const possiblePaths = [
    path.resolve(import.meta.dirname, "../..", "dist", "public"), // Local build
    path.resolve(import.meta.dirname, "public"), // Alternative path
    path.resolve(process.cwd(), "dist", "public"), // Absolute path
    path.resolve(process.cwd(), "public"), // Fallback
  ];

  let distPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      distPath = possiblePath;
      console.log(`[Static] Serving from: ${distPath}`);
      break;
    }
  }

  if (!distPath) {
    console.error(
      `[Static] Could not find the build directory. Tried: ${possiblePaths.join(", ")}`
    );
    return;
  }

  expressApp.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  expressApp.use("*", (_req: any, res: any) => {
    const indexPath = path.resolve(distPath!, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not found");
    }
  });
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Create the Express app (exported for Vercel serverless functions)
type CreateAppOptions = {
  server?: Server;
};

export async function createApp(options?: CreateAppOptions) {
  const app = express();
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  // Use a string-based dynamic import to prevent esbuild from analyzing vite.js in production
  if (process.env.NODE_ENV === "development" && options?.server && process.env.VERCEL !== "1") {
    // Only import vite in local development - use Function constructor to hide from esbuild
    const viteModule = await new Function('return import("./vite.js")')();
    await viteModule.setupVite(app, options.server);
  } else {
    // In production, use a simple static file server that doesn't import vite
    serveStaticProduction(app);
  }

  return app;
}

async function startServer() {
  const server = createServer();
  const app = await createApp({ server });
  server.on("request", app);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Only start the server if not in Vercel environment
if (process.env.VERCEL !== "1") {
  startServer().catch(console.error);
}

// Export the function for Vercel serverless functions
// Don't call it at module level - let the API handler call it
export default createApp;
