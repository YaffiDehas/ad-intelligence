// ============================================================
// features/sidebar/Sidebar.tsx
// Product navigation — desktop only (hidden on mobile).
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

export function Sidebar() {
  // Granular selectors — re-renders only when product selection changes
  const selectedProduct = useAppStore((s) => s.selectedProduct);
  const setProduct = useAppStore((s) => s.setProduct);

  const { data, isLoading } = useProducts();

  return (
    <aside className="sidebar">
      <span className="sidebar__label">Products</span>

      {isLoading &&
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="sidebar__skeleton" />
        ))}

      {data?.products.map((product) => (
        <button
          key={product}
          className={`sidebar__item${
            selectedProduct === product ? ' sidebar__item--active' : ''
          }`}
          onClick={() => setProduct(product)}
        >
          <span className="sidebar__item-icon">
            {PRODUCT_ICONS[product] ?? '📦'}
          </span>
          <span className="sidebar__item-name">{product}</span>
        </button>
      ))}
    </aside>
  );
}