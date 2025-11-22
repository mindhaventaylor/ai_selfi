import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express, server: Server) {
  // Only run in development - this should never be called in production
  // This check prevents any code below from executing in production builds
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL === "1") {
    throw new Error("setupVite should only be called in development mode");
  }
  
  // Dynamically import vite only when needed (development mode)
  const { createServer: createViteServer } = await import("vite");
  
  // Use eval to prevent esbuild from analyzing this import at bundle time
  // This ensures vite.config.js and its dependencies are never bundled
  let viteConfig: any;
  try {
    // Use Function constructor to create a dynamic import that esbuild can't analyze
    const importConfig = new Function('return import("../../vite.config.js")');
    const mod = await importConfig();
    viteConfig = mod.default ?? mod;
  } catch (error) {
    // Fallback: create minimal config inline if vite.config.js is not available
    console.warn("[Vite] Could not load vite.config.js, using minimal config");
    viteConfig = {
      plugins: [],
      root: path.resolve(__dirname, "../..", "client"),
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "../..", "client", "src"),
          "@shared": path.resolve(__dirname, "../..", "shared"),
        },
      },
    };
  }
  const expressApp = app as any;
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

  expressApp.use(vite.middlewares);
  expressApp.use("*", async (req: any, res: any, next: any) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
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
      
      // Replace environment variable placeholders
      const envReplacements: Record<string, string> = {
        "%VITE_APP_LOGO%": process.env.VITE_APP_LOGO || "/favicon.png",
        "%VITE_APP_TITLE%": process.env.VITE_APP_TITLE || "AISelfi",
      };
      
      for (const [placeholder, value] of Object.entries(envReplacements)) {
        template = template.replace(new RegExp(placeholder.replace(/%/g, "\\%"), "g"), value);
      }
      
      // Conditionally inject analytics script if env vars are set
      const analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT;
      const analyticsWebsiteId = process.env.VITE_ANALYTICS_WEBSITE_ID;
      if (analyticsEndpoint && analyticsWebsiteId) {
        const analyticsScript = `\n    <script
      defer
      src="${analyticsEndpoint}/umami"
      data-website-id="${analyticsWebsiteId}"></script>`;
        template = template.replace(
          "<!-- Analytics script will be conditionally injected if env vars are set -->",
          analyticsScript
        );
      } else {
        // Remove the comment if analytics is not configured
        template = template.replace(
          /<!-- Analytics script will be conditionally injected if env vars are set -->\s*/g,
          ""
        );
      }
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
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
    path.resolve(__dirname, "../..", "dist", "public"), // Local build
    path.resolve(__dirname, "public"), // Alternative path
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
