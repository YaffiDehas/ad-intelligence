import type { StatsResponse } from '../../types/api';

interface KPICardProps {
  label: string;
  icon: string;
  color: string;
  data?: StatsResponse;
  isLoading?: boolean;
  animDelay?: number;
}

export function KPICard({ label, icon, color, data, isLoading, animDelay = 0 }: KPICardProps) {
  const trend = data ? parseFloat(String(data.trend)) : 0;
  const isPos = trend >= 0;

  return (
    <div
      className={`kpi-card fade-up`}
      style={{
        ['--kpi-color' as string]: color,
        animationDelay: `${animDelay}s`,
        opacity: 0,
      }}
    >
      <div className="kpi-card__label">{label}</div>

      {isLoading || !data ? (
        <>
          <div className="skeleton" style={{ height: 36, width: '60%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: '80%' }} />
        </>
      ) : (
        <>
          <div className="kpi-card__value">
            {data.current.toLocaleString()}
          </div>
          <div className="kpi-card__meta">
            <span className={`kpi-card__trend kpi-card__trend--${isPos ? 'pos' : 'neg'}`}>
              {isPos ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="kpi-card__benchmark">
              vs {data.benchmark.toLocaleString()} bm
            </span>
          </div>
        </>
      )}

      <span className="kpi-card__icon">{icon}</span>
    </div>
  );
}
