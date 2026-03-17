// ============================================================
// features/mobile-nav/MobileNav.tsx
// Fixed bottom navigation bar — replaces Sidebar on mobile (≤768px).
//
// Selector optimization:
// Subscribes only to selectedProduct and setProduct.
// Does not re-render when date range or theme changes.
// ============================================================

import { useAppStore } from '../../store/useAppStore';
import { useProducts } from '../../hooks/useDataFetching';

const PRODUCT_ICONS: Record<string, string> = {
  'Nike Air Max':   '👟',
  'Nike React':     '⚡',
  'Nike Pegasus':   '🪶',
  'Nike Mercurial': '🔥',
  'Nike Blazer':    '🌟',
};

export function MobileNav() {
  // Granular selectors — re-renders only when product selection changes
  const selectedProduct = useAppStore((s) => s.selectedProduct);
  const setProduct = useAppStore((s) => s.setProduct);

  const { data, isLoading } = useProducts();

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav__scroll">

        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mobile-nav__skeleton" />
          ))}

        {data?.products.map((product) => (
          <button
            key={product}
            className={`mobile-nav__item${
              selectedProduct === product ? ' mobile-nav__item--active' : ''
            }`}
            onClick={() => setProduct(product)}
          >
            <span className="mobile-nav__icon">
              {PRODUCT_ICONS[product] ?? '📦'}
            </span>
            {/* Strip "Nike " prefix to fit compact mobile layout */}
            <span className="mobile-nav__label">{product.replace('Nike ', '')}</span>
          </button>
        ))}

      </div>
    </nav>
  );
}