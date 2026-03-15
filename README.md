# Ad Intelligence Dashboard

A professional React SPA built as part of a Senior Frontend Engineer technical assessment. The dashboard visualizes Nike ad campaign data from a provided backend emulator.

---

## Quick Start

### With Docker (recommended)
```bash
docker-compose up --build
```
Frontend available at `http://localhost:8080`

### Local Development (hot reload)
```bash
# Terminal 1 — Backend
cd backend
npm install
node backend.js

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```
Frontend available at `http://localhost:5173`

---

## Project Structure

```
src/
├── api/
│   ├── client.ts          # Base HTTP client, config loader, env detection
│   └── endpoints.ts       # Typed endpoint functions + normalizeImageUrl
├── features/
│   ├── ad-card/
│   │   ├── AdCard.tsx     # Ad card layout — delegates image to AdCardImage
│   │   ├── AdCardImage.tsx# Image state machine (loading → loaded | error)
│   │   └── ad-card.scss
│   ├── dashboard/
│   │   ├── Dashboard.tsx  # KPI grid + lazy QuickWins
│   │   └── dashboard.scss
│   ├── header/
│   │   ├── Header.tsx     # Date range, server status, theme toggle
│   │   └── header.scss
│   ├── KPICard/
│   │   └── KPICard.tsx    # Individual KPI metric card
│   ├── layout/
│   │   └── layout.scss
│   ├── mobile-nav/
│   │   ├── MobileNav.tsx  # Fixed bottom nav — mobile only
│   │   └── mobile-nav.scss
│   ├── quick-wins/
│   │   ├── QuickWins.tsx  # Infinite scroll ad grid
│   │   └── quick-wins.scss
│   └── sidebar/
│       ├── Sidebar.tsx    # Product navigation — desktop only
│       └── sidebar.scss
├── hooks/
│   └── useDataFetching.ts # All TanStack Query hooks
├── store/
│   └── useAppStore.ts     # Zustand global state
├── styles/
│   ├── main.scss          # Entry point — import order matters
│   ├── variables.scss     # Bootstrap overrides + design tokens
│   └── base.scss          # CSS custom properties, reset, animations
└── types/
    └── api.ts             # All API contracts and data models
```

---

## Design Rationale

The layout uses a fixed sidebar for product navigation with a scrollable main content area. This keeps navigation always visible on desktop — important for a power-user dashboard where product switching is a primary action.

Visual hierarchy places KPI metrics at the top (glanceable numbers) followed by the Ad Discovery section below (exploratory content). This matches the natural usage pattern: check high-level health metrics first, then explore specific creatives.

Dark mode is the default theme, appropriate for an analytics tool used for extended periods. Light mode is available and persists across sessions via Zustand's `persist` middleware.

**Typography:** Inter (display) + JetBrains Mono (monospace/metrics). Inter is the standard for data-dense dashboards — highly legible at small sizes. JetBrains Mono renders numbers with consistent character widths, ideal for metric values.

---

## Technical Architecture

### State Management
Zustand handles all ephemeral global UI state — selected product, date range, and theme. The store uses the `persist` middleware so preferences survive page refreshes. Server state (API data) is intentionally kept out of Zustand and owned entirely by TanStack Query.

### Performance & API Strategy

**TanStack Query** handles all server-state caching, deduplication, and background refetching:

| Query | Cache Strategy | Reason |
|---|---|---|
| `server-state` | `refetchInterval: 60s` | Powers "Last Updated" — must stay fresh |
| `products` | `staleTime: Infinity` | Product list never changes |
| `stats` | `staleTime: 30s` | Near-real-time metrics |
| `wins` | `staleTime: 30s`, infinite | Paginated — cached per page |

Query keys include all filter params `[section, product, start, end]` so the cache invalidates automatically when the user changes filters.

**Lazy Loading:** `QuickWins` is lazy-loaded via `React.lazy` + `Suspense`, deferring its bundle until the route renders.

**Infinite scroll:** `useInfiniteQuery` combined with `react-intersection-observer`. When the sentinel element enters the viewport, the next page is fetched automatically. The `has_more` flag from the API controls when fetching stops.

**Config loading:** `config.json` is loaded via a Promise singleton — all concurrent callers on mount share the same fetch, preventing the duplicate requests that occur with a simple null-check cache.

### Docker & API Routing

The frontend Dockerfile uses a multi-stage build: Vite compiles the app in stage 1, nginx serves the static output in stage 2. nginx is configured to proxy `/api/*` requests to the backend container internally.

`config.json` specifies `baseUrl: "http://localhost:3000"` for local development. In Docker, `client.ts` detects that the configured host differs from the app host and automatically falls back to `window.location.origin`, routing all API calls through the nginx proxy.

This means **no changes to `config.json` are needed** between environments.

---

## Deliberate Engineering Decisions

### API Slug Definition
The `/api/stats/:section` endpoint slugs are not defined in the spec. I defined `active | launched | hooks | lifespan` as a TypeScript union type (`StatSection`) based on the four KPI names, creating a single typed source of truth in `KPI_CONFIG`. Any invalid slug value produces a TypeScript compile error rather than a silent runtime failure.

### Image Error Handling
Image URLs returned by `/api/wins` occasionally fail to load — this is intentional per the spec. Each ad card implements a 3-state machine (`loading → loaded | error`):

- **`loading`** — animated shimmer skeleton fills the image area
- **`loaded`** — image fades in via opacity transition
- **`error`** — the `<img>` element is fully unmounted from the DOM, preventing the browser's native broken image icon. A designed fallback with a landscape icon and campaign title renders instead.

A single retry is attempted before settling on the error state, since the backend randomizes URLs — a retry has a meaningful chance of succeeding.

Cards with failed images are kept in their grid position. The image is a presentation asset — hiding the entire card would silently remove valid ad data from the user's view.

**Note on browser limitations:** The browser's `onError` event does not expose HTTP status codes for image requests. We cannot distinguish a 404 from a network timeout — the retry is a best-effort attempt in both cases.

### Cache Buster Normalization
The `/api/wins` endpoint appends `?t=Date.now()+Math.random()` to every image URL. This is a backend anti-pattern that defeats browser image caching, causing repeated network requests on every pagination load. `normalizeImageUrl()` in `endpoints.ts` strips the `t` parameter before the URL reaches the `<img>` tag, restoring standard browser caching behavior. This is documented here as a known backend issue that should be resolved at the source in a production environment.

### React Hooks Compliance
KPI data fetching uses a dedicated `KPIItem` sub-component per metric rather than calling `useStats` inside a `.map()` loop. Calling hooks inside loops violates React's Rules of Hooks. Each `KPIItem` calls `useStats` at the top level of its own component — the correct pattern.

### Image Component Separation
Image state logic is extracted into a dedicated `AdCardImage` component, separate from `AdCard`. This follows the single responsibility principle — `AdCard` handles layout and data display, `AdCardImage` owns the loading state machine. The SVG fallback icon is further extracted as `ImageFallbackIcon` for clarity.

---

## Responsive Philosophy

| Breakpoint | Layout |
|---|---|
| Desktop (>768px) | Fixed sidebar + scrollable main content |
| Tablet (≤1100px) | KPI grid collapses from 4 to 2 columns |
| Tablet nav (480–768px) | Bottom nav items stretch evenly — no empty space at row end |
| Mobile (≤768px) | Sidebar replaced by fixed bottom nav with horizontal scroll |
| Small phones (≤380px) | Ad grid collapses to single column |

On mobile, `overflow: hidden` is removed from `.app-shell` — it clips `position: fixed` children (the mobile nav) on certain mobile browsers. The main content area handles its own scroll via `overflow-y: auto`. `100dvh` is used instead of `100vh` to account for the dynamic browser toolbar in mobile Safari and Chrome.

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 |
| Infinite Scroll | react-intersection-observer |
| Styling | Bootstrap 5 + SCSS modules |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Containerization | Docker + nginx (multi-stage build) |