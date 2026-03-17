// ============================================================
// App.tsx
// Root application shell.
//
// Selector optimization:
// Subscribes only to `theme` — AppShell re-renders only when theme
// changes, not on every product/date filter change.
// ============================================================

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store/useAppStore';
import { Header } from './features/header/header';
import { Sidebar } from './features/sidebar/sidebar';
import { MobileNav } from './features/mobile-nav/mobile-nav';
import { Dashboard } from './features/dashboard/dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AppShell() {
  // Granular selector — re-renders only when theme changes
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <Header />
      <Sidebar />
      <Dashboard />
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}