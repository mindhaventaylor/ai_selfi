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

  const currentPath = window.location.pathname + window.location.search;
  const params = new URLSearchParams(window.location.search);
  const variant = params.get("variant");
  
  let redirectUrl = `/?returnUrl=${encodeURIComponent(currentPath)}`;
  if (variant) {
    redirectUrl += `&variant=${variant}`;
  }
  
  window.location.href = redirectUrl;
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
  // Use import.meta.env.PROD instead of process.env (Vite provides this)
  const isProduction = import.meta.env.PROD;
  
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
  // Use import.meta.env.PROD instead of process.env (Vite provides this)
  const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
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
    
    // Also dispatch event for HTML timeout handler
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event('app-rendered'));
    }
  };
  
  // Set up global marker so App component can signal when it's rendered
  (window as any).__APP_RENDERED_CALLBACK__ = markAppAsRendered;
  
  loadingTimeout = setTimeout(() => {
    // Final check - if app was marked as rendered, don't show error
    if (appRendered) {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      return;
    }
    
    console.warn("[Main] Timeout reached - checking if React actually rendered...");
    
    // Final check if React has mounted (sometimes the callback doesn't fire but React is there)
    const hasReactMounted = rootElement.children.length > 0;
    const hasSubstantialContent = rootElement.innerHTML.trim().length > 100;
    const hasAnyContent = rootElement.innerHTML.trim().length > 0;
    
    // Check for React-specific markers (React adds data-reactroot or other attributes)
    const hasReactMarkers = rootElement.innerHTML.includes('data-react') || 
                           rootElement.innerHTML.includes('__react') ||
                           rootElement.innerHTML.includes('react-');
    
    // If React mounted but callback wasn't called, mark as rendered and return
    if (hasReactMounted || hasSubstantialContent || (hasAnyContent && hasReactMarkers)) {
      markAppAsRendered();
      return;
    }
    
    // Only show error if React truly hasn't mounted after all checks
    console.error(`[Main] App failed to render after ${timeoutDuration}ms - React has not mounted`);
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
  }, timeoutDuration);

  try {
    createRoot(rootElement).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
    
    // Immediately check if React mounted (it should be synchronous)
    setTimeout(() => {
      const hasMounted = rootElement.children.length > 0;
      const hasContent = rootElement.innerHTML.trim().length > 50;
      
      if (hasMounted || hasContent) {
        markAppAsRendered();
      }
    }, 100);
    
    // Check periodically if app has rendered (React might take time to hydrate)
    // React renders immediately, but content may load asynchronously
    // We consider the app "rendered" once React has mounted, even if showing loading state
    let checkCount = 0;
    const maxChecks = 60; // Check for up to 30 seconds (60 * 500ms) - matches timeout duration
    const checkInterval = setInterval(() => {
      checkCount++;
      // Consider app rendered if React has mounted (has any children, even loading spinner)
      const hasReactMounted = rootElement.children.length > 0;
      const hasContent = rootElement.innerHTML.trim().length > 50; // At least some HTML content
      
      // If React has mounted OR if callback was called, mark as rendered
      if ((hasReactMounted || hasContent) && !appRendered) {
        markAppAsRendered();
        clearInterval(checkInterval);
      } else if (checkCount >= maxChecks) {
        // Stop checking after max attempts
        clearInterval(checkInterval);
        // Final check - if React mounted at all, mark as rendered (even without callback)
        if ((hasReactMounted || hasContent) && !appRendered) {
          markAppAsRendered();
        }
      }
    }, 500); // Check every 500ms
  } catch (error: any) {
    clearTimeout(loadingTimeout);
    console.error("[Main] ❌ CRITICAL: Failed to render React app");
    console.error("[Main] Error type:", error?.constructor?.name);
    console.error("[Main] Error message:", error?.message);
    console.error("[Main] Error stack:", error?.stack);
    console.error("[Main] Full error object:", error);
    
    // Show detailed error to user
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
