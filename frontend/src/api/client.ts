// ============================================================
// api/client.ts
// Base HTTP client for all API communication.
//
// Key decisions:
// - config.json is loaded once via a Promise singleton to prevent
//   duplicate fetches when multiple queries fire in parallel on mount.
// - resolveBaseUrl handles both local dev (direct to :3000)
//   and Docker (nginx proxies /api/* to backend internally).
//   Detection: if configured host differs from app host → use current origin.
// ============================================================

import type { ApiConfig } from '../types/api';

// Promise singleton — all concurrent callers share the same fetch,
// preventing duplicate config.json requests on mount.
let configPromise: Promise<ApiConfig> | null = null;

export function loadConfig(): Promise<ApiConfig> {
  if (!configPromise) {
    configPromise = fetch('/config.json').then((res) => res.json());
  }
  return configPromise;
}

// Resolves the correct base URL for the current environment.
//
// Local dev:  baseUrl = localhost:3000, app = localhost:5173 → ports differ → use localhost:5173 (Vite proxies)
// Docker:     baseUrl = localhost:3000, app = localhost:8080 → ports differ → use localhost:8080 (nginx proxies)
// Same host:  baseUrl = app host → use config as-is
function resolveBaseUrl(configuredUrl: string): string {
  try {
    const configured = new URL(configuredUrl);
    const current = new URL(window.location.href);
    if (configured.host !== current.host) {
      return current.origin;
    }
    return configuredUrl;
  } catch {
    // Empty or invalid baseUrl — fall back to current origin
    return window.location.origin;
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const config = await loadConfig();
  const base = resolveBaseUrl(config.api.baseUrl);
  const url = new URL(`${base}${path}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(config.api.timeout),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}