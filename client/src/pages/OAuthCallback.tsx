import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";

export default function OAuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const syncSessionMutation = trpc.auth.syncSession.useMutation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // Supabase handles the OAuth callback automatically
        // Extract the session from the URL hash if present
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const errorParam = hashParams.get("error");

        if (errorParam) {
          setError(decodeURIComponent(errorParam));
          return;
        }

        // Wait for Supabase to process the callback
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          return;
        }

        if (data.session) {
          // Sync session with server and set cookie
          try {
            console.log("[OAuth] Attempting to sync session...");
            const result = await syncSessionMutation.mutateAsync({ 
              accessToken: data.session.access_token 
            });
            console.log("[OAuth] Sync result:", result);
            
            // Wait a bit for cookie to be set
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Refresh user data and wait for it to complete
            await utils.auth.me.invalidate();
            
            // Fetch user data to ensure it's available before redirecting
            const userData = await utils.auth.me.fetch();
            console.log("[OAuth] User data fetched:", userData);
            
            if (!userData) {
              throw new Error("Failed to fetch user data after sync");
            }
            
            // Redirect to dashboard
            setLocation("/dashboard");
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
              "Failed to sync session";
            
            // Check if it's a network error
            if (errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
              errorMessage = "Network error: Could not connect to server. Please ensure the server is running and try again.";
            } 
            // Check if it's a database connection error
            else if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo") || errorMessage.includes("Failed query")) {
              errorMessage = "Database connection error: Could not connect to Supabase database. Please check DATABASE_URL in your .env file and ensure it's correctly configured.";
            }
            // Check if it's an API key error
            else if (errorMessage.includes("Invalid API key") || errorMessage.includes("API key")) {
              errorMessage = "Server configuration error: Invalid Supabase API key. Please check SUPABASE_SERVICE_ROLE_KEY in your .env file.";
            }
            // Check if it's a token verification error
            else if (errorMessage.includes("Token verification failed") || errorMessage.includes("Invalid access token")) {
              errorMessage = "Authentication failed: Could not verify your session. Please try signing in again.";
            }
            
            setError(errorMessage);
          }
        } else {
          setError("No session found. Please try signing in again.");
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a href="/login" className="text-primary hover:underline">
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

