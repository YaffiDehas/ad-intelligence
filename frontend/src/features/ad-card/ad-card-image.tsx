// ============================================================
// features/ad-card/AdCardImage.tsx
// Handles all image loading states for an ad card thumbnail.
//
// State machine: loading → loaded | error
//
// loading: animated shimmer skeleton fills the image area
// loaded:  image fades in via opacity transition
// error:   <img> is fully unmounted from the DOM (not just hidden)
//          to prevent the browser's native broken image icon from
//          rendering. A designed fallback with icon + title shows instead.
//
// Retry logic:
// One retry is attempted before settling on the error state.
// The backend randomizes image URLs on each request, so a retry
// has a meaningful chance of resolving to a valid image.
// Note: the browser's onError event does not expose HTTP status codes
// for image requests, so we cannot distinguish a 404 from a network
// error — the retry is a best-effort attempt in both cases.
// ============================================================

import { useState, useCallback } from 'react';

type ImageStatus = 'loading' | 'loaded' | 'error';

interface AdCardImageProps {
  src: string;
  alt: string;
}

// Extracted as a named component for clarity and potential reuse
function ImageFallbackIcon() {
  return (
    <svg
      className="ad-card__fallback-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3" y="3"
        width="18" height="18"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <path
        d="M3 16l5-5 4 4 3-3 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AdCardImage({ src, alt }: AdCardImageProps) {
  const [status, setStatus] = useState<ImageStatus>('loading');
  const [retried, setRetried] = useState(false);

  const handleError = useCallback(() => {
    if (!retried) {
      setRetried(true);
      const retryImg = new Image();
      retryImg.src = `${src}&retry=1`;
      retryImg.onload = () => setStatus('loaded');
      retryImg.onerror = () => setStatus('error');
    } else {
      setStatus('error');
    }
  }, [retried, src]);

  return (
    <div className="ad-card__image-wrap">

      {status === 'loading' && (
        <div className="ad-card__skeleton" aria-hidden="true" />
      )}

      {status === 'error' && (
        <div className="ad-card__fallback" aria-label="Image unavailable">
          <div className="ad-card__fallback-inner">
            <ImageFallbackIcon />
            <span className="ad-card__fallback-label">{alt}</span>
          </div>
        </div>
      )}

      {status !== 'error' && (
        <img
          className="ad-card__image"
          src={src}
          alt={alt}
          loading="lazy"
          style={{ opacity: status === 'loaded' ? 1 : 0 }}
          onLoad={() => setStatus('loaded')}
          onError={handleError}
        />
      )}

    </div>
  );
}