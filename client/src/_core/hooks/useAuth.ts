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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/oauth/callback`,
      },
    });
    if (error) throw error;
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
