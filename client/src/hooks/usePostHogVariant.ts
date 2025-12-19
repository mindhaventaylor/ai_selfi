import { useEffect, useState, useRef } from "react";
import { safeLocalStorage } from "@/utils/localStorage";

declare global {
  interface Window {
    posthog?: {
      init: (apiKey: string, config: any) => void;
      getFeatureFlag: (flag: string) => string | boolean | undefined;
      onFeatureFlags: (callback: () => void) => void;
      isFeatureEnabled: (flag: string) => boolean;
      identify: (userId: string, properties?: any) => void;
      capture: (event: string, properties?: any) => void;
      reset: () => void;
      __loaded?: boolean;
    };
  }
}

const VARIANT_CACHE_KEY = "aiselfi_dashboard_variant";
const FIRST_VARIANT_KEY = "aiselfi_first_dashboard_variant"; // Store the first variant the user ever sees
const POSTHOG_API_KEY = "phc_67dWkHktFLDuxuUy7zOYyyRBwOj25sw3plZHtKjZzy0";
const FEATURE_FLAG_KEY = "dashboard-variant";

export type DashboardVariant = "page1" | "page2" | "page3";

// Normalize page1 to page2 - page1 should never be used
function normalizeVariant(variant: DashboardVariant | null): DashboardVariant {
  if (variant === "page1") {
    return "page2";
  }
  return variant || "page2";
}

export function usePostHogVariant(userId?: string | number): {
  variant: DashboardVariant;
  isLoading: boolean;
} {
  const [variant, setVariant] = useState<DashboardVariant>("page2");
  const [isLoading, setIsLoading] = useState(true);
  const listenerRegisteredRef = useRef(false); // Track if onFeatureFlags listener is registered
  const hasInitializedRef = useRef(false); // Track if variant has been initialized

  useEffect(() => {
    // Check for URL parameter first (highest priority)
    const urlParams = new URLSearchParams(window.location.search);
    const urlVariantRaw = urlParams.get("variant") as DashboardVariant | null;
    const urlVariant = normalizeVariant(urlVariantRaw);
    
    // If already initialized and no URL variant param, skip re-initialization
    // This prevents the hook from re-running when tabs or other state changes
    if (hasInitializedRef.current && !urlVariantRaw) {
      // Only update if variant from localStorage differs from current state
      const cachedVariantRaw = safeLocalStorage.getItem(VARIANT_CACHE_KEY) as DashboardVariant | null;
      const cachedVariant = normalizeVariant(cachedVariantRaw);
      if (cachedVariant && cachedVariant !== variant) {
        setVariant(cachedVariant);
      }
      return;
    }
    
    if (urlVariantRaw && (urlVariantRaw === "page1" || urlVariantRaw === "page2" || urlVariantRaw === "page3")) {
      // If variant is provided in URL, normalize page1 to page2 and update it as the new default (first variant)
      // This allows users to change their default by changing the URL
      safeLocalStorage.setItem(FIRST_VARIANT_KEY, urlVariant);
      safeLocalStorage.setItem(VARIANT_CACHE_KEY, urlVariant);
      setVariant(urlVariant);
      setIsLoading(false);
      hasInitializedRef.current = true;
      
      // Track variant assignment from URL
      if (window.posthog?.capture) {
        window.posthog.capture("dashboard_variant_set_via_url", {
          variant: urlVariant,
          userId: userId ? String(userId) : undefined,
        });
      }
      
      // Don't remove variant from URL on pages that need it (like /dashboard/generate)
      // Only remove on dashboard pages where it's just used to set the default
      const pathname = window.location.pathname;
      const isGeneratePage = pathname.includes("/dashboard/generate");
      
      if (!isGeneratePage) {
        // Don't remove variant from URL immediately - let components read it first
        // Only remove after a short delay to ensure all components have read it
        setTimeout(() => {
          const currentParams = new URLSearchParams(window.location.search);
          if (currentParams.get("variant") === urlVariant) {
            currentParams.delete("variant");
            const newUrl = window.location.pathname + (currentParams.toString() ? `?${currentParams.toString()}` : "");
            window.history.replaceState({}, "", newUrl);
          }
        }, 1000);
      }
      
      return;
    }
    // Initialize PostHog if not already loaded
    if (typeof window !== "undefined" && !window.posthog?.__loaded) {
      const script = document.createElement("script");
      script.innerHTML = `
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init Rr Mr fi Cr Ar ci Tr Fr capture Mi calculateEventProperties Lr register register_once register_for_session unregister unregister_for_session Hr getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Ur jr createPersonProfile zr kr Br opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Dr debug M Nr getPageViewId captureTraceFeedback captureTraceMetric $r".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('${POSTHOG_API_KEY}', {
          api_host: 'https://us.i.posthog.com',
          defaults: '2025-05-24',
          person_profiles: 'identified_only',
        });
      `;
      document.head.appendChild(script);
    }

    // Declare checkPostHog in the outer scope so cleanup can access it
    let checkPostHog: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Wait for PostHog to load (it's already loaded in the HTML)
    // Check if PostHog is already available
    if (window.posthog?.__loaded) {
      loadVariant();
    } else {
      // Wait for PostHog to load
      checkPostHog = setInterval(() => {
        if (window.posthog?.__loaded) {
          if (checkPostHog) clearInterval(checkPostHog);
          loadVariant();
        }
      }, 100);

      // Timeout after 3 seconds
      timeoutId = setTimeout(() => {
        if (checkPostHog) clearInterval(checkPostHog);
        if (!window.posthog?.__loaded) {
          console.warn("[PostHog] Failed to load, using cached variant");
          loadCachedVariant();
        }
      }, 3000);
    }

        function loadVariant() {
          try {
            // Check if user has a first variant stored (persistent, never changes)
            const firstVariantRaw = safeLocalStorage.getItem(FIRST_VARIANT_KEY) as DashboardVariant | null;
            const firstVariant = normalizeVariant(firstVariantRaw);
            
            if (firstVariantRaw && (firstVariantRaw === "page1" || firstVariantRaw === "page2" || firstVariantRaw === "page3")) {
              // User already has a first variant - normalize and use it
              setVariant(firstVariant);
              safeLocalStorage.setItem(VARIANT_CACHE_KEY, firstVariant);
              // Update first variant if it was page1
              if (firstVariantRaw === "page1") {
                safeLocalStorage.setItem(FIRST_VARIANT_KEY, firstVariant);
              }
              setIsLoading(false);
              hasInitializedRef.current = true;
              
              // Track variant view
              if (window.posthog?.capture) {
                window.posthog.capture("dashboard_variant_viewed", {
                  variant: firstVariant,
                  isFirstVariant: true,
                });
              }
              return;
            }
            
            // No first variant stored - this is the first time user sees a variant
            // Check cache first
            const cachedVariantRaw = safeLocalStorage.getItem(VARIANT_CACHE_KEY) as DashboardVariant | null;
            const cachedVariant = normalizeVariant(cachedVariantRaw);
            
            if (cachedVariantRaw && (cachedVariantRaw === "page1" || cachedVariantRaw === "page2" || cachedVariantRaw === "page3")) {
              // Store as first variant (normalized) and use it
              safeLocalStorage.setItem(FIRST_VARIANT_KEY, cachedVariant);
              setVariant(cachedVariant);
              setIsLoading(false);
              hasInitializedRef.current = true;
              
              // Track first variant assignment
              if (window.posthog?.capture) {
                window.posthog.capture("dashboard_first_variant_assigned", {
                  variant: cachedVariant,
                  userId: userId ? String(userId) : undefined,
                });
              }
              return;
            }

            // No cache, get from PostHog (first time)
            if (window.posthog) {
              // Identify user if userId is provided
              if (userId && window.posthog.identify) {
                window.posthog.identify(String(userId));
              }

              // Get feature flag value
              const flagValue = window.posthog.getFeatureFlag(FEATURE_FLAG_KEY);
              const newVariant: DashboardVariant =
                flagValue === "page2" ? "page2" : flagValue === "page3" ? "page3" : "page2";
              
              // Store as first variant (persistent, never changes)
              safeLocalStorage.setItem(FIRST_VARIANT_KEY, newVariant);
              safeLocalStorage.setItem(VARIANT_CACHE_KEY, newVariant);
              setVariant(newVariant);
              hasInitializedRef.current = true;
              
              // Track first variant assignment
              window.posthog.capture("dashboard_first_variant_assigned", {
                variant: newVariant,
                userId: userId ? String(userId) : undefined,
              });
            } else {
              // Fallback to page2 if PostHog not available
              const defaultVariant: DashboardVariant = "page2";
              safeLocalStorage.setItem(FIRST_VARIANT_KEY, defaultVariant);
              safeLocalStorage.setItem(VARIANT_CACHE_KEY, defaultVariant);
              setVariant(defaultVariant);
              hasInitializedRef.current = true;
            }
          } catch (error) {
            console.error("[PostHog] Error loading variant:", error);
            loadCachedVariant();
          } finally {
            setIsLoading(false);
          }
        }

    function loadCachedVariant() {
      // Check if first variant exists
      const firstVariantRaw = safeLocalStorage.getItem(FIRST_VARIANT_KEY) as DashboardVariant | null;
      const firstVariant = normalizeVariant(firstVariantRaw);
      if (firstVariantRaw && (firstVariantRaw === "page1" || firstVariantRaw === "page2" || firstVariantRaw === "page3")) {
        // Use first variant if it exists (normalized)
        setVariant(firstVariant);
        safeLocalStorage.setItem(VARIANT_CACHE_KEY, firstVariant);
        // Update first variant if it was page1
        if (firstVariantRaw === "page1") {
          safeLocalStorage.setItem(FIRST_VARIANT_KEY, firstVariant);
        }
        hasInitializedRef.current = true;
      } else {
        // Check cache
        const cachedRaw = safeLocalStorage.getItem(VARIANT_CACHE_KEY) as DashboardVariant | null;
        const cached = normalizeVariant(cachedRaw);
        if (cachedRaw && (cachedRaw === "page1" || cachedRaw === "page2" || cachedRaw === "page3")) {
          // Save cache as first variant if it doesn't exist (normalized)
          safeLocalStorage.setItem(FIRST_VARIANT_KEY, cached);
          setVariant(cached);
          hasInitializedRef.current = true;
        } else {
          // Default to page2 and save as first variant
          const defaultVariant: DashboardVariant = "page2";
          safeLocalStorage.setItem(FIRST_VARIANT_KEY, defaultVariant);
          safeLocalStorage.setItem(VARIANT_CACHE_KEY, defaultVariant);
          setVariant(defaultVariant);
          hasInitializedRef.current = true;
        }
      }
      setIsLoading(false);
    }

    // Listen for feature flag updates - only if first variant is not set and listener not registered
    // Once first variant is set, ignore PostHog updates to maintain consistency
    const firstVariant = safeLocalStorage.getItem(FIRST_VARIANT_KEY);
    if (!firstVariant && window.posthog?.onFeatureFlags && !listenerRegisteredRef.current) {
      const handleFeatureFlags = () => {
        // Check again if first variant was set (might have been set by another component)
        const currentFirstVariant = safeLocalStorage.getItem(FIRST_VARIANT_KEY);
        if (currentFirstVariant) {
          // First variant already set, ignore this update
          return;
        }
        
        const flagValue = window.posthog?.getFeatureFlag(FEATURE_FLAG_KEY);
        const newVariant: DashboardVariant =
          flagValue === "page2" ? "page2" : flagValue === "page3" ? "page3" : "page2";
        
        // Only update if first variant is not set
        if (!safeLocalStorage.getItem(FIRST_VARIANT_KEY)) {
          safeLocalStorage.setItem(FIRST_VARIANT_KEY, newVariant);
          safeLocalStorage.setItem(VARIANT_CACHE_KEY, newVariant);
          setVariant(newVariant);
        }
      };
      
      window.posthog.onFeatureFlags(handleFeatureFlags);
      listenerRegisteredRef.current = true;
    }

    return () => {
      if (checkPostHog) clearInterval(checkPostHog);
      if (timeoutId) clearTimeout(timeoutId);
      // Note: PostHog doesn't provide a way to remove listeners, but we track registration with ref
    };
  }, [userId]); // Removed variant from dependencies to avoid infinite loops

  // Always normalize the variant before returning (in case it somehow got set to page1)
  const normalizedVariant = normalizeVariant(variant);
  
  // Update state if needed (using useEffect to avoid setState during render)
  useEffect(() => {
    if (normalizedVariant !== variant) {
      setVariant(normalizedVariant);
    }
  }, [normalizedVariant, variant]);
  
  return { variant: normalizedVariant, isLoading };
}

