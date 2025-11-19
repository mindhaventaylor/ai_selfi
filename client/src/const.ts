export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "/aiselfies_logo.png";

// Note: Supabase OAuth should be called directly via signInWithOAuth()
// This function is kept for backward compatibility but should not be used
export const getLoginUrl = () => {
  // Return a placeholder - actual OAuth should use signInWithOAuth() from useAuth hook
  return "#";
};
