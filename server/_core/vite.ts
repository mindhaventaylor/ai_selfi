import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // On Vercel, static files are served by Vercel itself, not Express
  // We only need to handle the SPA fallback (serve index.html for non-API routes)
  if (process.env.VERCEL === "1") {
    // On Vercel, only handle SPA fallback for non-API routes
    app.use("*", (req, res, next) => {
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

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req: express.Request, res: express.Response) => {
    const indexPath = path.resolve(distPath!, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not found");
    }
  });
}
