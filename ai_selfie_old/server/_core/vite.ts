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
        "%VITE_APP_TITLE%": process.env.VITE_APP_TITLE || "AISelfie",
      };
      
      for (const [placeholder, value] of Object.entries(envReplacements)) {
        template = template.replace(new RegExp(placeholder.replace(/%/g, "\\%"), "g"), value);
      }
      
      // Conditionally inject analytics script if env vars are set
      const analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT;
      const analyticsWebsiteId = process.env.VITE_ANALYTICS_WEBSITE_ID;
      let analyticsScript = "";
      if (analyticsEndpoint && analyticsWebsiteId) {
        analyticsScript = `\n    <script
      defer
      src="${analyticsEndpoint}/umami"
      data-website-id="${analyticsWebsiteId}"></script>`;
      }

      // Inject PostHog script
      const posthogScript = `
    <script>
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init Rr Mr fi Cr Ar ci Tr Fr capture Mi calculateEventProperties Lr register register_once register_for_session unregister unregister_for_session Hr getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Ur jr createPersonProfile zr kr Br opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Dr debug M Nr getPageViewId captureTraceFeedback captureTraceMetric $r".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('phc_67dWkHktFLDuxuUy7zOYyyRBwOj25sw3plZHtKjZzy0', {
        api_host: 'https://us.i.posthog.com',
        defaults: '2025-05-24',
        person_profiles: 'identified_only',
      });
    </script>`;

      // Replace analytics comment with both scripts
      if (analyticsScript) {
        template = template.replace(
          "<!-- Analytics script will be conditionally injected if env vars are set -->",
          analyticsScript + posthogScript
        );
      } else {
        template = template.replace(
          "<!-- Analytics script will be conditionally injected if env vars are set -->",
          posthogScript
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
