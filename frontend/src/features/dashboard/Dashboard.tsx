// ============================================================
// features/dashboard/Dashboard.tsx
// Main dashboard layout — KPI metrics + Quick Wins ad discovery.
//
// Selector optimization:
// KPIItem subscribes only to the 3 filter values it needs.
// Dashboard subscribes only to selectedProduct for the empty state check.
// This prevents unnecessary re-renders when unrelated state (e.g. theme)
// changes in the Zustand store.
//
// Hooks rules compliance:
// useStats is called inside KPIItem — a dedicated component per KPI —
// never inside a .map() loop. This satisfies React's Rules of Hooks.
// ============================================================

import { lazy, Suspense } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useStats } from '../../hooks/useDataFetching';
import { KPICard } from '../kpi-card/KPICard';
import type { StatSection } from '../../types/api';

const QuickWins = lazy(() =>
  import('../quick-wins/QuickWins').then((m) => ({ default: m.QuickWins }))
);

// Single source of truth for KPI sections.
// Slugs map to /api/stats/:section — defined by us, not the spec.
const KPI_CONFIG: {
  section: StatSection;
  label: string;
  icon: string;
  colorVar: string;
}[] = [
  { section: 'active',   label: 'Active Ads',       icon: '📡', colorVar: '--kpi-1' },
  { section: 'launched', label: 'Ads Launched',      icon: '🚀', colorVar: '--kpi-2' },
  { section: 'hooks',    label: 'New Hooks',         icon: '🎣', colorVar: '--kpi-3' },
  { section: 'lifespan', label: 'Creative Lifespan', icon: '⏳', colorVar: '--kpi-4' },
];

interface KPIItemProps {
  section: StatSection;
  label: string;
  icon: string;
  colorVar: string;
  index: number;
}

function KPIItem({ section, label, icon, colorVar, index }: KPIItemProps) {
  // Granular selectors — re-renders only when these 3 values change,
  // not when theme or other unrelated store state changes
  const selectedProduct = useAppStore((s) => s.selectedProduct);
  const startDate = useAppStore((s) => s.startDate);
  const endDate = useAppStore((s) => s.endDate);

  const { data, isLoading } = useStats(section, selectedProduct, startDate, endDate);

  return (
    <KPICard
      label={label}
      icon={icon}
      color={`var(${colorVar})`}
      data={data}
      isLoading={isLoading}
      animDelay={index * 0.05}
    />
  );
}

function KPISection() {
  return (
    <div>
      <p className="section-title">Key Metrics</p>
      <div className="kpi-grid">
        {KPI_CONFIG.map((config, i) => (
          <KPIItem key={config.section} {...config} index={i} />
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  // Only subscribes to selectedProduct — not startDate/endDate/theme
  const selectedProduct = useAppStore((s) => s.selectedProduct);

  return (
    <main className="main-content">
      {!selectedProduct && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-muted)',
            padding: '4px 0',
          }}
        >
          ← Select a product from the sidebar to load metrics
        </div>
      )}
      <KPISection />
      <Suspense
        fallback={
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        }
      >
        <QuickWins />
      </Suspense>
    </main>
  );
}