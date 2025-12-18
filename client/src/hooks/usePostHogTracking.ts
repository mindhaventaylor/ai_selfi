import { useEffect } from "react";
import { useLocation } from "wouter";
import { initPostHog, trackPageView } from "@/lib/posthog";

export function usePostHogTracking() {
  const [location] = useLocation();

  useEffect(() => {
    initPostHog().then(() => {
      trackPageView(location, {
        timestamp: new Date().toISOString(),
      });
    });
  }, [location]);
}

export function usePostHogInit() {
  useEffect(() => {
    initPostHog().then(() => {
      console.log("[PostHog] Tracking initialized");
    });
  }, []);
}