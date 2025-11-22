import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig, type Plugin } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// Plugin to replace HTML placeholders and conditionally inject analytics
function htmlReplacePlugin(): Plugin {
  return {
    name: "html-replace",
    transformIndexHtml(html) {
      // Replace environment variable placeholders
      const envReplacements: Record<string, string> = {
        "%VITE_APP_LOGO%": process.env.VITE_APP_LOGO || "/favicon.png",
        "%VITE_APP_TITLE%": process.env.VITE_APP_TITLE || "AISelfi",
      };
      
      let result = html;
      for (const [placeholder, value] of Object.entries(envReplacements)) {
        result = result.replace(new RegExp(placeholder.replace(/%/g, "\\%"), "g"), value);
      }
      
      // Conditionally inject analytics script if env vars are set
      const analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT;
      const analyticsWebsiteId = process.env.VITE_ANALYTICS_WEBSITE_ID;
      if (analyticsEndpoint && analyticsWebsiteId) {
        const analyticsScript = `\n    <script
      defer
      src="${analyticsEndpoint}/umami"
      data-website-id="${analyticsWebsiteId}"></script>`;
        result = result.replace(
          "<!-- Analytics script will be conditionally injected if env vars are set -->",
          analyticsScript
        );
      } else {
        // Remove the comment if analytics is not configured
        result = result.replace(
          /<!-- Analytics script will be conditionally injected if env vars are set -->\s*/g,
          ""
        );
      }
      
      return result;
    },
  };
}

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), htmlReplacePlugin()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
