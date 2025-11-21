import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  // redirectPath removed since we use signIn directly
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false } = options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      // Sign out from Supabase first
      await supabase.auth.signOut();
      
      // Then clear server-side session
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // Already logged out, continue
      } else {
        console.error("Logout error:", error);
        // Continue with logout even if there's an error
      }
    } finally {
      // Clear client-side cache
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      
      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, [logoutMutation, utils]);

  const signIn = useCallback(async () => {
    // Use the current origin to ensure we redirect back to localhost in development
    const redirectUrl = `${window.location.origin}/oauth/callback`;
    console.log("[Auth] Signing in with redirect URL:", redirectUrl);
    console.log("[Auth] Current origin:", window.location.origin);
    console.log("[Auth] Current href:", window.location.href);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Skip browser redirect and handle it manually if needed
          skipBrowserRedirect: false,
        },
      });
      
      if (error) {
        console.error("[Auth] Sign in error:", error);
        throw error;
      }
      
      // Log the OAuth URL for debugging
      if (data?.url) {
        console.log("[Auth] OAuth URL:", data.url);
      }
    } catch (err) {
      console.error("[Auth] Sign in failed:", err);
      throw err;
    }
  }, []);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;

    signIn();
  }, [
    redirectOnUnauthenticated,
    meQuery.isLoading,
    logoutMutation.isPending,
    state.user,
    signIn,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    signIn,
  };
}
