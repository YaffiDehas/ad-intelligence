// ============================================================
// hooks/useDataFetching.ts
// TanStack Query hooks — one hook per API endpoint.
//
// Cache strategy:
// - server-state: refetches every 60s (powers "Last Updated" indicator)
// - products:     staleTime Infinity — product list never changes
// - stats:        staleTime 30s — metrics are near-real-time
// - wins:         staleTime 30s — paginated infinite query
//
// Query keys include all filter params (product, start, end) so the
// cache invalidates automatically when the user changes filters.
//
// Note on useStats usage:
// useStats must be called at the top level of a component — never inside
// a .map(). Each KPI metric renders via its own KPIItem component to
// comply with React's Rules of Hooks.
// ============================================================

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchServerState, fetchProducts, fetchStats, fetchWins } from '../api/endpoints';
import type { StatSection } from '../types/api';

export const useServerState = () =>
  useQuery({
    queryKey: ['server-state'],
    queryFn: fetchServerState,
    refetchInterval: 60_000,  // Poll every 60s to keep "Last Updated" fresh
    staleTime: 30_000,
  });

export const useProducts = () =>
  useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: Infinity,  // Product list is static — never refetch
  });

export const useStats = (
  section: StatSection,
  product: string,
  start: string,
  end: string
) =>
  useQuery({
    queryKey: ['stats', section, product, start, end],
    queryFn: () => fetchStats(section, product, start, end),
    enabled: !!product,  // Don't fetch until a product is selected
    staleTime: 30_000,
  });

export const useWins = (product: string, start: string, end: string) =>
  useInfiniteQuery({
    queryKey: ['wins', product, start, end],
    queryFn: ({ pageParam }) => fetchWins(pageParam as number, product, start, end),
    initialPageParam: 1,
    // has_more flag from backend controls pagination — returns false at page 5
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.has_more ? (lastPageParam as number) + 1 : undefined,
    enabled: !!product,
    staleTime: 30_000,
  });