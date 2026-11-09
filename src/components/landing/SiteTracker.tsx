"use client";

import { useEffect } from "react";

/**
 * Detect the correct API URL based on the current hostname.
 * Falls back to env var if set, otherwise uses hostname-based detection.
 */
function getApiUrl(): string | null {
  // Check for explicit env var first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Hostname-based detection (no env var needed)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "menodao.org" || hostname === "www.menodao.org") {
      return "https://api.menodao.org";
    }
    if (hostname === "menodao.co.ke" || hostname === "www.menodao.co.ke") {
      return "https://api.menodao.org";
    }
    // Local development
    if (hostname === "localhost") {
      return "http://localhost:3000";
    }
  }

  return null;
}

/**
 * SiteTracker — fires a single POST to the backend on page load
 * to record the visit with UTM params and referrer info.
 * Uses navigator.sendBeacon for non-blocking delivery.
 */
export default function SiteTracker() {
  useEffect(() => {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) return;

      // Only track once per page per session
      const trackingKey = `tracked_${window.location.pathname}`;
      if (sessionStorage.getItem(trackingKey)) return;
      sessionStorage.setItem(trackingKey, "1");

      // Parse UTM params from URL
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get("utm_source") || undefined;
      const utmMedium = params.get("utm_medium") || undefined;
      const utmCampaign = params.get("utm_campaign") || undefined;

      // Get or create a session ID
      let sessionId = sessionStorage.getItem("meno_session_id");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("meno_session_id", sessionId);
      }

      const payload = JSON.stringify({
        page: window.location.pathname,
        referrer: document.referrer || undefined,
        utmSource,
        utmMedium,
        utmCampaign,
        sessionId,
      });

      // Use sendBeacon for non-blocking delivery, fallback to fetch
      const sent = navigator.sendBeacon(
        `${apiUrl}/analytics/track`,
        new Blob([payload], { type: "application/json" }),
      );

      if (!sent) {
        fetch(`${apiUrl}/analytics/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Silently fail — analytics should never break the page
        });
      }
    } catch {
      // Silently fail
    }
  }, []);

  return null;
}
