// ============================================================
// features/header/Header.tsx
// Global header — date range controls, server status, theme toggle.
//
// Selector optimization:
// Subscribes to startDate, endDate, theme, setDateRange, toggleTheme.
// Does NOT subscribe to selectedProduct — so the header does not
// re-render when the user switches products.
// ============================================================

import { useAppStore } from '../../store/useAppStore';
import { useServerState } from '../../hooks/useDataFetching';

export function Header() {
  // Granular selectors — only what this component actually needs
  const startDate = useAppStore((s) => s.startDate);
  const endDate = useAppStore((s) => s.endDate);
  const theme = useAppStore((s) => s.theme);
  const setDateRange = useAppStore((s) => s.setDateRange);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  const { data: serverState } = useServerState();

  // Full date + time — time-only was ambiguous across days
  const formattedTime = serverState?.timestamp
    ? new Date(serverState.timestamp).toLocaleString([], {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <header className="header">
      <div className="header__logo">
        <div className="header__logo-icon">AI</div>
        <span className="header__logo-text">Ad Intelligence</span>
      </div>

      <div className="header__controls">
        <div className="date-range">
          <label>From</label>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setDateRange(e.target.value, endDate)}
          />
          <span className="date-range__sep">→</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setDateRange(startDate, e.target.value)}
          />
        </div>
      </div>

      <div className="header__spacer" />

      <div className="header__right">
        <div className="server-badge">
          <span
            className={`server-badge__dot${
              serverState?.status === 'up' ? '' : ' server-badge__dot--down'
            }`}
          />
          {serverState ? `Updated ${formattedTime}` : 'Connecting...'}
        </div>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}