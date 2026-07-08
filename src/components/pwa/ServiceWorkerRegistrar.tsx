"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production only (a SW in dev fights
 * Turbopack HMR and caches stale assets). Renders nothing.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app still works online.
      });
    }
  }, []);

  return null;
}
