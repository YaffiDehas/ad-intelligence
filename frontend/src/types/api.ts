// ============================================================
// types/api.ts
// All API contracts and data models for the Ad Intelligence dashboard.
// These types mirror the backend response shapes exactly —
// any change to the backend API should be reflected here first.
// ============================================================

// --- Server health ---

export interface ServerState {
  status: 'up' | 'down';
  timestamp: string; // ISO 8601 — used for "Last Updated" indicator in header
  uptime: number;
}

// --- Products ---

export interface ProductsResponse {
  products: string[]; // e.g. ['Nike Air Max', 'Nike React', ...]
}

// --- KPI Stats ---

// StatSection slugs are not defined in the spec — we own these strings.
// They map to: Active Ads | Ads Launched | New Hooks | Creative Lifespan
export type StatSection = 'active' | 'launched' | 'hooks' | 'lifespan';

export interface StatsResponse {
  section: string;
  current: number;    // Primary metric value
  trend: number;      // % change — negative means decline
  benchmark: number;  // Comparison baseline
}

// --- Ad Creatives ---

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;  // May occasionally 404 — handled by AdCardImage state machine
  launched: string;  // ISO date string e.g. '2026-03-07'
  duplications: number;
}

export interface WinsResponse {
  ads: Ad[];
  has_more: boolean; // Controls infinite scroll — false when page 5 is reached
}

// --- Config ---

// Loaded once at runtime from /public/config.json.
// baseUrl is intentionally empty in Docker — nginx proxies /api/* to backend.
export interface ApiConfig {
  api: {
    baseUrl: string;
    timeout: number;
    endpoints: {
      serverState: string;
      products: string;
      stats: string;
      wins: string;
    };
  };
  mockSettings: {
    enableLatency: boolean;
    latencyRange: [number, number];
  };
}