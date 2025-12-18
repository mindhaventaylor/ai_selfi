// PostHog initialization and tracking utilities for all pages
declare global {
    interface Window {
      posthog?: {
        init: (apiKey: string, config: any) => void;
        capture: (event: string, properties?: any) => void;
        identify: (userId: string, properties?: any) => void;
        reset: () => void;
        __loaded?: boolean;
        getFeatureFlag: (flag: string) => string | boolean | undefined;
        onFeatureFlags: (callback: () => void) => void;
        isFeatureEnabled: (flag: string) => boolean;
      };
    }
  }
  
  const POSTHOG_API_KEY = "phc_67dWkHktFLDuxuUy7zOYyyRBwOj25sw3plZHtKjZzy0";
  
  let isInitialized = false;
  let initPromise: Promise<void> | null = null;
  
  export function initPostHog(): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.resolve();
    }
  
    if (initPromise) {
      return initPromise;
    }
  
    if (isInitialized && window.posthog?.__loaded) {
      return Promise.resolve();
    }
  
    initPromise = new Promise((resolve) => {
      if (window.posthog?.__loaded) {
        isInitialized = true;
        resolve();
        return;
      }
  
      const script = document.createElement("script");
      script.innerHTML = `!function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init Rr Mr fi Cr Ar ci Tr Fr capture Mi calculateEventProperties Lr register register_once register_for_session unregister unregister_for_session Hr getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Ur jr createPersonProfile zr kr Br opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Dr debug M Nr getPageViewId captureTraceFeedback captureTraceMetric $r".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('${POSTHOG_API_KEY}', {
          api_host: 'https://us.i.posthog.com',
          defaults: '2025-05-24',
          person_profiles: 'identified_only',
          autocapture: true,
          capture_pageview: true,
          capture_pageleave: true,
          loaded: function(posthog) {
            posthog.__loaded = true;
            isInitialized = true;
            console.log('[PostHog] ✅ Initialized successfully');
            resolve();
          }
        });`;
      document.head.appendChild(script);
  
      setTimeout(() => {
        if (!isInitialized) {
          isInitialized = true;
          resolve();
        }
      }, 3000);
    });
  
    return initPromise;
  }
  
  export function trackPageView(path?: string, properties?: Record<string, any>) {
    if (typeof window === "undefined" || !window.posthog) {
      return;
    }
  
    const pagePath = path || window.location.pathname;
    window.posthog.capture("$pageview", {
      $current_url: window.location.href,
      path: pagePath,
      ...properties,
    });
  }
  
  export function trackEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof window === "undefined" || !window.posthog) {
      return;
    }
    window.posthog.capture(eventName, properties);
  }
  
  export function identifyUser(userId: string, properties?: Record<string, any>) {
    if (typeof window === "undefined" || !window.posthog) {
      return;
    }
    window.posthog.identify(userId, properties);
  }
  
  export function resetPostHog() {
    if (typeof window === "undefined" || !window.posthog) {
      return;
    }
    window.posthog.reset();
  }