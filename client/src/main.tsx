import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, splitLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent queries from hanging indefinitely
      staleTime: 30 * 1000, // 30 seconds - data is fresh for 30s
      gcTime: 5 * 60 * 1000, // 5 minutes - cache data for 5 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof TRPCClientError) {
          const status = (error as any).data?.httpStatus;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Add network timeout to prevent hanging
      networkMode: 'online',
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

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

// Fetch wrapper with timeout to prevent hanging requests
// In production, use longer timeout for auth queries during login
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 15000): Promise<Response> {
  const isAuthQuery = typeof input === 'string' && input.includes('/auth.me');
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  
  // Use longer timeout for auth queries in production (login can be slower)
  const effectiveTimeout = isAuthQuery && isProduction ? Math.max(timeoutMs, 20000) : timeoutMs;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
  
  return globalThis.fetch(input, {
    ...(init ?? {}),
    credentials: "include",
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  }).catch((error) => {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${effectiveTimeout}ms`);
    }
    throw error;
  });
}

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      // Batch queries (GET requests)
      condition: (op) => op.type === 'query',
      true: httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch(input, init) {
          return fetchWithTimeout(input, init, 15000); // 15 second timeout for queries
        },
      }),
      // Don't batch mutations (POST requests)
      false: httpLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch(input, init) {
          return fetchWithTimeout(input, init, 30000); // 30 second timeout for mutations
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
  // Increased timeout for production - accounts for slow networks and API calls during login
  // Use longer timeout in production (30s) vs development (15s)
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const timeoutDuration = isProduction ? 30000 : 15000; // 30s in prod, 15s in dev
  
  let appRendered = false;
  let loadingTimeout: NodeJS.Timeout | null = null;
  
  // Function to clear timeout when app actually renders
  const markAppAsRendered = () => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    appRendered = true;
    console.log("[Main] App rendered successfully");
    
    // Also dispatch event for HTML timeout handler
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event('app-rendered'));
    }
  };
  
  // Set up global marker so App component can signal when it's rendered
  (window as any).__APP_RENDERED_CALLBACK__ = markAppAsRendered;
  
  loadingTimeout = setTimeout(() => {
    if (appRendered) {
      // App already rendered, just clear timeout
      if (loadingTimeout) clearTimeout(loadingTimeout);
      return;
    }
    
    console.warn("[Main] App seems stuck - checking for errors...");
    // Check if React has mounted at all (any children means React rendered)
    const hasReactMounted = rootElement.children.length > 0;
    const hasSubstantialContent = rootElement.innerHTML.trim().length > 100;
    
    if (!hasReactMounted) {
      console.error(`[Main] App failed to render after ${timeoutDuration}ms - likely cached bundle issue or API timeout`);
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; text-align: center; max-width: 600px; margin: 50px auto;">
          <h1>Loading Issue Detected</h1>
          <p>The app seems to be stuck loading. This might be due to cached files or a slow connection.</p>
          <p style="margin-top: 20px; margin-bottom: 10px;">
            <button onclick="window.location.reload(true)" style="padding: 12px 24px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 16px;">
              Hard Reload (Clear Cache)
            </button>
          </p>
          <p style="margin-top: 10px;">
            <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload(true)" style="padding: 10px 20px; cursor: pointer; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 14px;">
              Clear All Data & Reload
            </button>
          </p>
          <p style="margin-top: 15px; font-size: 12px; color: #666;">
            Keyboard shortcut: <strong>Ctrl+Shift+R</strong> (Windows/Linux) or <strong>Cmd+Shift+R</strong> (Mac)
          </p>
          <p style="margin-top: 10px; font-size: 11px; color: #999;">
            If the problem persists, try opening in an incognito/private window.
          </p>
        </div>
      `;
    } else {
      // App has some content, just taking time to fully render
      console.log("[Main] App has content but may still be loading - extending timeout check");
    }
  }, timeoutDuration);

  try {
    createRoot(rootElement).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
    
    // Check periodically if app has rendered (React might take time to hydrate)
    // React renders immediately, but content may load asynchronously
    // We consider the app "rendered" once React has mounted, even if showing loading state
    let checkCount = 0;
    const maxChecks = 10; // Check for up to 5 seconds (10 * 500ms) before giving up on quick render
    const checkInterval = setInterval(() => {
      checkCount++;
      // Consider app rendered if React has mounted (has any children, even loading spinner)
      const hasReactMounted = rootElement.children.length > 0;
      
      if (hasReactMounted && !appRendered) {
        markAppAsRendered();
        clearInterval(checkInterval);
      } else if (checkCount >= maxChecks) {
        // Stop checking after max attempts - the App component callback will handle it
        clearInterval(checkInterval);
        // But if React mounted, mark as rendered anyway
        if (hasReactMounted && !appRendered) {
          markAppAsRendered();
        }
      }
    }, 500); // Check every 500ms
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
