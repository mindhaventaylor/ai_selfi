import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";

export default function OAuthCallback() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const syncSessionMutation = trpc.auth.syncSession.useMutation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    // Signal that OAuthCallback is rendering (prevents loading timeout)
    if (typeof window !== "undefined" && (window as any).__APP_RENDERED_CALLBACK__) {
      (window as any).__APP_RENDERED_CALLBACK__();
    }

    const handleCallback = async () => {
      try {
        // Check if we're on the wrong domain (production when we should be on localhost)
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isProduction = window.location.hostname.includes('aiselfie.org');
        
        // Use import.meta.env.DEV instead of process.env (Vite provides this)
        if (!isLocalhost && import.meta.env.DEV) {
          console.warn("[OAuth] Warning: OAuth callback received on non-localhost domain:", window.location.hostname);
          console.warn("[OAuth] This usually means Supabase redirect URL is not configured for localhost");
          console.warn("[OAuth] Please add http://localhost:3000/oauth/callback to Supabase allowed redirect URLs");
        }

        // Supabase handles the OAuth callback automatically
        // Extract the session from the URL hash if present
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const errorParam = hashParams.get("error");

        if (errorParam) {
          setError(decodeURIComponent(errorParam));
          return;
        }

        // Wait for Supabase to process the callback (with timeout)
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Session retrieval timeout after 10 seconds")), 10000)
        );
        
        const { data, error: sessionError } = await Promise.race([
          sessionPromise,
          sessionTimeout
        ]) as any;
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message || "Failed to retrieve session");
          return;
        }

        if (data.session) {
          // Sync session with server and set cookie
          try {
            // Add timeout wrapper for sync session mutation
            const syncPromise = syncSessionMutation.mutateAsync({ 
              accessToken: data.session.access_token 
            });
            
            const syncTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Sync session timeout after 20 seconds")), 20000)
            );
            
            await Promise.race([syncPromise, syncTimeout]);
            
            // Wait a bit for cookie to be set
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Refresh user data and wait for it to complete (with timeout)
            try {
              await utils.auth.me.invalidate();
              
              // Fetch user data to ensure it's available before redirecting (with timeout)
              const fetchPromise = utils.auth.me.fetch();
              const fetchTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Fetch user data timeout after 15 seconds")), 15000)
              );
              
              const userData = await Promise.race([fetchPromise, fetchTimeout]) as any;
              
              if (!userData) {
                console.warn("[OAuth] No user data received, but proceeding with redirect");
                // Don't throw - proceed anyway as session is valid
              }
              
              // Redirect to dashboard or return URL
              const returnUrl = localStorage.getItem("auth_return_url");
              if (returnUrl) {
                localStorage.removeItem("auth_return_url");
                setLocation(returnUrl);
              } else {
                setLocation("/dashboard");
              }
            } catch (fetchError: any) {
              console.warn("[OAuth] Error fetching user data, but session is valid. Redirecting anyway:", fetchError);
              // Even if fetch fails, we have a valid session, so redirect
              const returnUrl = localStorage.getItem("auth_return_url");
              if (returnUrl) {
                localStorage.removeItem("auth_return_url");
                setLocation(returnUrl);
              } else {
                setLocation("/dashboard");
              }
            }
          } catch (syncError: any) {
            console.error("Sync error details:", {
              message: syncError?.message,
              data: syncError?.data,
              shape: syncError?.shape,
              cause: syncError?.cause,
              fullError: syncError,
              stack: syncError?.stack,
            });
            
            // Extract the actual error message
            let errorMessage = 
              syncError?.message || 
              syncError?.data?.message || 
              syncError?.shape?.message ||
              syncError?.cause?.message ||
              t("oauthCallback.failedToSyncSession");
            
            // Check if it's a network error
            if (errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
              errorMessage = t("oauthCallback.networkError");
            } 
            // Check if it's a database connection error
            else if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo") || errorMessage.includes("Failed query")) {
              errorMessage = t("oauthCallback.databaseError");
            }
            // Check if it's an API key error
            else if (errorMessage.includes("Invalid API key") || errorMessage.includes("API key")) {
              errorMessage = t("oauthCallback.apiKeyError");
            }
            // Check if it's a token verification error
            else if (errorMessage.includes("Token verification failed") || errorMessage.includes("Invalid access token")) {
              errorMessage = t("oauthCallback.tokenError");
            }
            
            setError(errorMessage);
          }
        } else {
          setError(t("oauthCallback.noSessionFound"));
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError(err instanceof Error ? err.message : t("oauthCallback.unknownError"));
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">{t("oauthCallback.authenticationError")}</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a href="/login" className="text-primary hover:underline">
            {t("oauthCallback.returnToLogin")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">{t("oauthCallback.completingSignIn")}</p>
      </div>
    </div>
  );
}

