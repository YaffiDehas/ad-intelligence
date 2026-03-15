// ============================================================
// store/useAppStore.ts
// Zustand global store for ephemeral UI state.
//
// Responsibilities:
// - selectedProduct: drives all API queries — changing it invalidates
//   stats and wins caches via TanStack Query key dependencies
// - startDate/endDate: global date range filter sent to all endpoints
// - theme: dark/light mode toggle
//
// Persistence:
// All state is persisted to localStorage via Zustand's persist middleware
// so filters and theme survive page refreshes.
//
// Note: server state (API data) is intentionally NOT stored here —
// that belongs to TanStack Query's cache.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';

interface AppState {
  selectedProduct: string;
  startDate: string;
  endDate: string;
  theme: Theme;
  setProduct: (product: string) => void;
  setDateRange: (start: string, end: string) => void;
  toggleTheme: () => void;
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

const fmt = (d: Date) => d.toISOString().split('T')[0];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedProduct: '',
      startDate: fmt(thirtyDaysAgo),
      endDate: fmt(today),
      theme: 'dark',
      setProduct: (product) => set({ selectedProduct: product }),
      setDateRange: (startDate, endDate) => set({ startDate, endDate }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'ad-intelligence-store',
      // Only persist UI preferences — not transient loading states
      partialize: (state) => ({
        theme: state.theme,
        selectedProduct: state.selectedProduct,
        startDate: state.startDate,
        endDate: state.endDate,
      }),
    }
  )
);