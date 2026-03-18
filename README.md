# Ad Intelligence Dashboard

A professional React SPA built as part of a Senior Frontend Engineer technical assessment. The dashboard visualizes Nike ad campaign data from a provided backend emulator, demonstrating production-grade architecture, performance patterns, and deliberate engineering decisions.

---

## Quick Start

### Docker (recommended)
```bash
docker-compose up --build
```
Frontend → `http://localhost:8080`

### Local Development (hot reload)
```bash
# Terminal 1 — Backend
cd backend && npm install && node backend.js

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```
Frontend → `http://localhost:5173`

> No environment changes needed between Docker and local dev — `client.ts` detects the runtime environment automatically. See [Docker & API Routing](#docker--api-routing).

---

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts               # HTTP client, Promise singleton config loader, env detection
│   │   └── endpoints.ts            # Typed endpoint functions + normalizeImageUrl utility
│   ├── features/
│   │   ├── ad-card/
│   │   │   ├── ad-card-image.tsx   # Self-contained image state machine (loading → loaded | error)
│   │   │   ├── ad-card.scss
│   │   │   └── ad-card.tsx         # Ad card layout — delegates image concerns to AdCardImage
│   │   ├── dashboard/
│   │   │   ├── dashboard.tsx       # KPI grid + lazy-loaded QuickWins
│   │   │   └── dashboard.scss
│   │   ├── header/
│   │   │   ├── header.tsx          # Date range picker, Last Updated badge, theme toggle
│   │   │   └── header.scss
│   │   ├── kpi-card/
│   │   │   └── kpi-card.tsx        # Individual KPI metric card with skeleton state
│   │   ├── layout/
│   │   │   └── layout.scss         # App shell grid layout + responsive breakpoints
│   │   ├── mobile-nav/
│   │   │   ├── mobile-nav.scss
│   │   │   └── mobile-nav.tsx       # Fixed bottom navigation — mobile only (≤768px)
│   │   ├── quick-wins/
│   │   │   ├── quick-wins.scss
│   │   │   └── quick-wins.tsx      # Infinite scroll ad grid with sentinel observer
│   │   └── sidebar/
│   │       ├── sidebar.tsx         # Product navigation — desktop only (>768px)
│   │       └── sidebar.scss
│   ├── hooks/
│   │   └── useDataFetching.ts      # All TanStack Query hooks — one per endpoint
│   ├── store/
│   │   └── useAppStore.ts          # Zustand store — UI state only, persisted to localStorage
│   ├── styles/
│   │   ├── base.scss               # CSS custom properties, reset, keyframes, shared utilities
│   │   ├── main.scss               # Single entry point — import order is load-order critical
│   │   └── variables.scss          # Bootstrap overrides + SCSS design tokens
│   └── types/
│       └── api.ts                  # Canonical API contracts and data models
├── nginx.conf                      # nginx SPA routing + /api/* proxy to backend
├── Dockerfile                      # Multi-stage build: Vite builder → nginx runner
├── index.html
├── package.json
└── vite.config.ts
```

---

## Design Rationale

### Layout
A fixed sidebar drives product navigation with a scrollable main content area. Product switching is the primary action on this dashboard — keeping navigation permanently visible eliminates an interaction step on every context change.

### Visual Hierarchy
KPI metrics sit above the ad discovery grid. Users arrive to check high-level campaign health first, then drill into creatives. The layout mirrors this natural workflow.

### Theming
Dark mode is the default — analytics tools are used for extended periods and dark backgrounds increase the visual weight of colored KPI accents. Light mode is available and persists across sessions via Zustand's `persist` middleware.

### Typography
**Inter** (display) + **JetBrains Mono** (monospace). Inter is highly legible at small sizes in data-dense layouts. JetBrains Mono uses consistent character widths for numeric glyphs — metric values don't cause layout shift when digits change.

---

## Technical Architecture

### State Ownership
Two distinct state layers with explicit boundaries:

- **Zustand** — ephemeral UI state: selected product, date range, theme. Persisted to `localStorage` so user preferences survive refreshes. Server data is intentionally excluded.
- **TanStack Query** — all server state: caching, deduplication, background sync. No API responses touch Zustand.

### Performance & API Strategy

| Query | Strategy | Rationale |
|---|---|---|
| `server-state` | `refetchInterval: 60s` | Drives "Last Updated" badge — needs live data |
| `products` | `staleTime: Infinity` | Static list — never refetch |
| `stats` | `staleTime: 30s` | Near-real-time metrics |
| `wins` | `staleTime: 30s` + infinite pages | Cached per page — pagination without re-fetching |

Query keys include all filter params `[section, product, start, end]`. Changing any filter triggers automatic cache invalidation and refetch — no manual cache management needed.

**Lazy Loading:** `QuickWins` is deferred via `React.lazy` + `Suspense`. The KPI section renders immediately while the heavier ad grid loads asynchronously.

**Infinite Scroll:** `useInfiniteQuery` + `react-intersection-observer`. A sentinel element at the list bottom triggers `fetchNextPage()` when it enters the viewport. The `has_more` flag from the API controls termination — no client-side page counting.

**Config Singleton:** `config.json` is loaded via a Promise singleton rather than a value cache:

```ts
let configPromise: Promise<ApiConfig> | null = null;

export function loadConfig(): Promise<ApiConfig> {
  if (!configPromise) {
    configPromise = fetch('/config.json').then(res => res.json());
  }
  return configPromise; // all callers share the same Promise
}
```

A naive `null` check cache fires duplicate requests because all 6 parallel queries on mount read `null` before any fetch resolves. The Promise singleton ensures a single network request regardless of concurrency.

### Docker & API Routing

Multi-stage Dockerfile: Vite compiles the app in the builder stage, nginx serves the static output in the runner stage. nginx proxies `/api/*` to the backend container on the internal Docker network.

`config.json` ships with `baseUrl: "http://localhost:3000"`. In Docker, `client.ts` detects that the configured host differs from the app host and falls back to `window.location.origin`, routing all requests through nginx:

```
Local dev:  configured=localhost:3000, app=localhost:5173 → ports differ → use :5173 → Vite proxy
Docker:     configured=localhost:3000, app=localhost:8080 → ports differ → use :8080 → nginx proxy
```

`config.json` requires no modification between environments.

---

## Deliberate Engineering Decisions

### API Slug Definition
`/api/stats/:section` slugs are undefined in the spec. I defined `active | launched | hooks | lifespan` as a TypeScript union type (`StatSection`) — a single typed source of truth in `KPI_CONFIG`. Invalid slugs produce compile-time errors rather than silent runtime failures.

### Image State Machine (`AdCardImage`)
Each ad card thumbnail is managed by a dedicated `AdCardImage` component implementing a 3-state machine:

```
loading → skeleton shimmer
loaded  → image fades in (opacity transition)
error   → <img> unmounted from DOM + designed fallback renders
```

The `<img>` element is **fully unmounted** on error — not hidden with `opacity: 0`. A hidden element still exists in the DOM and triggers the browser's native broken image icon. Unmounting eliminates the element entirely.

#### Render Optimization

Unstable props — function references recreated on every render — were identified via React DevTools Profiler as the source of unnecessary re-renders across the ad grid. Memoization was applied surgically to the confirmed bottleneck only, not preemptively. The guiding principle: **measure first, optimize with purpose** — memoization carries its own cost in dependency tracking and readability, and should only be introduced where profiling justifies it.

One retry is attempted before settling on error. The backend randomizes URLs on each request — a retry has a meaningful chance of resolving to a valid image.

**Browser limitation:** `onError` does not expose HTTP status codes for image requests. A 404 and a network timeout are indistinguishable — the retry is a best-effort attempt in both cases.

Cards with failed images remain in grid position. The image is a presentation asset — removing the card would silently drop valid ad data from the user's view.

### Cache Buster Normalization
`/api/wins` appends `?t=Date.now()+Math.random()` to every image URL — a backend anti-pattern that defeats browser caching and causes redundant network requests on every pagination load. `normalizeImageUrl()` strips the `t` parameter before the URL reaches `<img src>`, restoring standard caching. This is flagged here as a known issue that should be fixed at the source in production.

### React Hooks Compliance
Each KPI renders in its own `KPIItem` component so `useStats` is called unconditionally at the top level — never inside a `.map()` loop. Calling hooks inside loops violates React's Rules of Hooks and produces non-deterministic hook ordering. The pattern also allows TanStack Query to deduplicate the 4 parallel stat requests correctly.

### Image Component Separation
Image state logic lives in `AdCardImage`, separate from `AdCard`. `AdCard` is responsible for layout and data rendering only. `AdCardImage` owns the full loading state machine. `ImageFallbackIcon` is extracted as a named sub-component for clarity and potential reuse. This follows the single responsibility principle at the component level.

---

## Responsive Philosophy

| Breakpoint | Layout |
|---|---|
| Desktop (>768px) | Fixed sidebar + scrollable main content |
| Tablet (≤1100px) | KPI grid: 4 → 2 columns |
| Tablet nav (480–768px) | Bottom nav items: `flex: 1` — fills full width, no trailing gap |
| Mobile (≤768px) | Sidebar hidden, replaced by fixed bottom nav |
| Small phones (≤380px) | Ad grid: 2 → 1 column |

Two non-obvious decisions:

1. **`overflow: hidden` removed from `.app-shell`** — a containing block with `overflow: hidden` clips `position: fixed` descendants on certain mobile browsers, hiding the bottom nav entirely.
2. **`100dvh` instead of `100vh`** — `100vh` on mobile Safari and Chrome does not account for the dynamic browser toolbar that appears and collapses on scroll. `100dvh` (dynamic viewport height) tracks the actual available height.

---

## Tech Stack

| Concern | Library | Version |
|---|---|---|
| Framework | React + TypeScript | 19 |
| Build | Vite | 7 |
| Server State | TanStack Query | v5 |
| Client State | Zustand | v5 |
| Infinite Scroll | react-intersection-observer | v10 |
| Styling | Bootstrap + SCSS | Bootstrap 5 |
| Fonts | Inter + JetBrains Mono | Google Fonts |
| Containerization | Docker + nginx | multi-stage build |