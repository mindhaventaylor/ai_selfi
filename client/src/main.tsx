import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, splitLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = "/login";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      // Batch queries (GET requests)
      condition: (op) => op.type === 'query',
      true: httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch(input, init) {
          return globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
          });
        },
      }),
      // Don't batch mutations (POST requests)
      false: httpLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch(input, init) {
          return globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
          });
        },
      }),
    }),
  ],
});

// Error boundary for React rendering errors
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("[Main] Root element not found!");
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Error: Root element not found</h1>
      <p>The application could not start because the root element is missing.</p>
      <p>Please check the HTML structure and ensure there is a &lt;div id="root"&gt;&lt;/div&gt; element.</p>
    </div>
  `;
} else {
  // Add a timeout to detect if the app is stuck loading
  const loadingTimeout = setTimeout(() => {
    console.warn("[Main] App seems stuck - checking for errors...");
    // Check if root is still empty after 5 seconds
    if (rootElement.children.length === 0) {
      console.error("[Main] App failed to render after 5 seconds - likely cached bundle issue");
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; text-align: center;">
          <h1>Loading Issue Detected</h1>
          <p>The app seems to be stuck loading. This might be due to cached files.</p>
          <p style="margin-top: 20px;">
            <button onclick="window.location.reload(true)" style="padding: 10px 20px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px;">
              Hard Reload (Clear Cache)
            </button>
          </p>
          <p style="margin-top: 10px; font-size: 12px; color: #666;">
            Or try: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
          </p>
        </div>
      `;
    }
  }, 5000);

  try {
    createRoot(rootElement).render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    );
    
    // Clear timeout if app renders successfully
    clearTimeout(loadingTimeout);
    console.log("[Main] App rendered successfully");
  } catch (error: any) {
    clearTimeout(loadingTimeout);
    console.error("[Main] Failed to render React app:", error);
    console.error("[Main] Error stack:", error?.stack);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; text-align: center;">
        <h1>Application Error</h1>
        <p>The application failed to start.</p>
        <p style="color: red; margin: 20px 0;">Error: ${error?.message || "Unknown error"}</p>
        <div style="margin-top: 20px;">
          <button onclick="window.location.reload(true)" style="padding: 10px 20px; margin: 5px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px;">
            Hard Reload (Clear Cache)
          </button>
          <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload(true)" style="padding: 10px 20px; margin: 5px; cursor: pointer; background: #dc3545; color: white; border: none; border-radius: 4px;">
            Clear All Data & Reload
          </button>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          If the problem persists, try opening the site in an incognito/private window.
        </p>
      </div>
    `;
  }
}

// Global error handler to catch unhandled errors
window.addEventListener('error', (event) => {
  console.error("[Main] Global error caught:", event.error);
  console.error("[Main] Error source:", event.filename, "line", event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error("[Main] Unhandled promise rejection:", event.reason);
});
