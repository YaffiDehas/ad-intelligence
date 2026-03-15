// ============================================================
// api/endpoints.ts
// Typed API endpoint functions — one function per endpoint.
// All functions delegate transport to apiGet() in client.ts.
//
// Note on normalizeImageUrl:
// The /api/wins endpoint appends ?t=Date.now()+Math.random() to every
// image URL, defeating browser caching. We strip this param before use
// so the browser can cache images normally across pagination loads.
// This is a known backend anti-pattern — flagged in README.
// ============================================================

import { apiGet } from './client';
import type {
  ServerState,
  ProductsResponse,
  StatsResponse,
  WinsResponse,
  StatSection,
} from '../types/api';

export const fetchServerState = (): Promise<ServerState> =>
  apiGet<ServerState>('/api/server-state');

export const fetchProducts = (): Promise<ProductsResponse> =>
  apiGet<ProductsResponse>('/api/products');

export const fetchStats = (
  section: StatSection,
  product: string,
  start: string,
  end: string
): Promise<StatsResponse> =>
  apiGet<StatsResponse>(`/api/stats/${section}`, { product, start, end });

export const fetchWins = (
  page: number,
  product: string,
  start: string,
  end: string
): Promise<WinsResponse> =>
  apiGet<WinsResponse>('/api/wins', {
    page: String(page),
    product,
    start,
    end,
  });

// Strips the cache-busting ?t= param added by the backend.
// Falls back to original URL if parsing fails.
export function normalizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('t');
    return parsed.toString();
  } catch {
    return url;
  }
}