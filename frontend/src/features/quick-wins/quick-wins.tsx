// ============================================================
// features/quick-wins/QuickWins.tsx
// Infinite scroll ad discovery section.
//
// Selector optimization:
// Subscribes only to the 3 filter values it needs.
// Does not re-render when theme changes.
//
// Scroll strategy:
// Sentinel element at bottom of list is observed by useInView.
// When it enters the viewport, the next page is fetched automatically.
// has_more flag from backend controls when pagination stops.
// ============================================================

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useWins } from '../../hooks/useDataFetching';
import { useAppStore } from '../../store/useAppStore';
import { AdCard } from '../ad-card/ad-card';

export function QuickWins() {
  // Granular selectors — re-renders only when filters change
  const selectedProduct = useAppStore((s) => s.selectedProduct);
  const startDate = useAppStore((s) => s.startDate);
  const endDate = useAppStore((s) => s.endDate);

  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useWins(selectedProduct, startDate, endDate);

  // Trigger next page fetch when sentinel scrolls into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allAds = data?.pages.flatMap((p) => p.ads) ?? [];

  if (!selectedProduct) {
    return (
      <div className="wins-section">
        <p className="section-title">Quick Wins — Ad Discovery</p>
        <div className="empty-state">
          <span className="empty-state__icon">👈</span>
          <span className="empty-state__text">Select a product to explore ad campaigns</span>
        </div>
      </div>
    );
  }

  return (
    <div className="wins-section">
      <p className="section-title">Quick Wins — Ad Discovery</p>

      {isLoading ? (
        <div className="wins-grid">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ borderRadius: 12, aspectRatio: '9/21' }} />
          ))}
        </div>
      ) : allAds.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">🔍</span>
          <span className="empty-state__text">No ads found for this selection</span>
        </div>
      ) : (
        <>
          <div className="wins-grid">
            {allAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>

          {/* Sentinel — observed by useInView to trigger next page fetch */}
          <div ref={sentinelRef} className="wins-sentinel">
            {isFetchingNextPage && <div className="spinner" />}
            {!hasNextPage && !isFetchingNextPage && (
              <p className="wins-end-msg">— End of results —</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}