// ============================================================
// AdCard.tsx
// Individual ad creative card.
// Image state management is delegated to <AdCardImage />.
// ============================================================

import type { Ad } from '../../types/api';
import { normalizeImageUrl } from '../../api/endpoints';
import { AdCardImage } from './ad-card-image';

interface AdCardProps {
  ad: Ad;
}

export function AdCard({ ad }: AdCardProps) {
  // Strip cache-busting param from URL — backend appends ?t=Date.now()+Math.random()
  // which defeats browser caching. We normalize to stable URL for proper caching.
  const stableImageUrl = normalizeImageUrl(ad.imageUrl);

  return (
    <div className="ad-card">

      <AdCardImage src={stableImageUrl} alt={ad.title} />

      <div className="ad-card__body">
        <div className="ad-card__title">{ad.title}</div>
        <div className="ad-card__desc">{ad.description}</div>
        <div className="ad-card__footer">
          <span className="ad-card__duplication">⧉ {ad.duplications}</span>
          <span className="ad-card__launched">{ad.launched}</span>
        </div>
      </div>

    </div>
  );
}