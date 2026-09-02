# Robotics Laboratory Website + Admin UI

Next.js (App Router) frontend for the university robotics laboratory site:
public website (`/`, `/research`, `/projects`, `/awards`, `/news`) and a
content management console under `/admin/**`. Data access is centralized in
`src/lib/api/` and typed from `contracts/openapi.json`.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript strict
- Tailwind CSS 4 (CSS-first tokens in `src/app/globals.css`)
- Package manager: pnpm

## Scripts

| Command          | Description                                        |
| ---------------- | -------------------------------------------------- |
| `pnpm dev`       | Start the dev server (http://localhost:3000)       |
| `pnpm build`     | Production build                                   |
| `pnpm start`     | Serve the production build                         |
| `pnpm lint`      | ESLint                                             |
| `pnpm typecheck` | `tsc --noEmit`                                     |
| `pnpm test`      | Vitest unit tests (data layer + pure helpers)      |
| `pnpm audit:contract` | Verify the data layer against `contracts/openapi.json` |

## API modes

The data layer switches between two implementations of the same `ApiClient`
interface, selected by `NEXT_PUBLIC_API_MODE` (see `.env.example`):

- **`real` (default, including when the variable is unset)** — HTTP against the CMS backend defined by
  `contracts/openapi.json`. The HTTP client sends every request with
  `cache: "no-store"` (see `src/lib/api/http.ts`), which opts each data
  route out of build-time prerendering: pages render per request, content
  is never frozen into static HTML, and the build succeeds even when the
  backend is unreachable. (Next 16 requires route segment config such as
  `export const dynamic` to be a static string literal, so the mode switch
  lives in the data layer instead of per-route exports.)
- **`mock` (explicit opt-in only)** — deterministic in-memory fixtures; no
  backend needed. Public pages are statically prerendered at build time.
  Admin credentials: `admin` / `admin123`.

Mock mode is intentionally isolated: the browser-side admin client and the
server-rendered public site can own separate in-memory fixture databases, so
admin edits are not persistent and are not guaranteed to appear on public
pages. Use real mode whenever testing CMS publishing or data synchronization.
Because real mode is the default, local public pages need the backend service
running; without it, data-driven sections show their load-failure state.

### Pointing at the real backend

Copy `.env.example` to `.env.local` and configure the backend origin. Real mode
is already the default, but it can be stated explicitly:

```bash
NEXT_PUBLIC_API_MODE=real
NEXT_PUBLIC_API_BASE_URL=/api/v1
BACKEND_ORIGIN=http://127.0.0.1:8000
```

Start the Codex backend first (see `backend/`), then run `pnpm dev`. For a
frontend-only visual session, explicitly set `NEXT_PUBLIC_API_MODE=mock` and
do not expect admin edits to persist or synchronize with server-rendered pages.

How the wiring works:

- **Browser:** requests go to the relative prefix `NEXT_PUBLIC_API_BASE_URL`
  (default `/api/v1`); `next.config.ts` rewrites `/api/v1/*` to
  `BACKEND_ORIGIN`, avoiding CORS during development.
- **Server components:** relative URLs are not fetchable server-side, so the
  API client automatically prefixes `BACKEND_ORIGIN` when rendering on the
  server (see `resolveApiBaseUrl` in `src/lib/api/client.ts`).
- **Images:** `BACKEND_ORIGIN` is allow-listed in `next.config.ts` remote
  patterns so uploaded media can be optimized by `next/image`.
- Setting `NEXT_PUBLIC_API_BASE_URL` to an absolute URL bypasses the proxy
  entirely (browser and server both use it as-is).

### Auth in real mode

Login (`/admin/login`) stores the bearer token from
`POST /api/v1/admin/auth/login` in `localStorage` (memory slot server-side).
Every admin request sends `Authorization: Bearer <token>`; a `401` clears
the token and redirects to `/admin/login`. There are no cookie sessions.

## Project layout

- `src/lib/api/` — the only place that talks to data: `ApiClient` interface,
  real HTTP client, mock adapter, bearer-token store, server read helpers.
- `src/lib/types/api.ts` — contract-exact types derived from
  `contracts/openapi.json` (no invented fields).
- `src/app/(public)/` — public site routes (static prerender in mock mode).
- `src/app/(admin)/admin/` — admin console (noindex, auth-guarded).
- `src/components/` — public components, motion primitives, admin UI.
- `public/mock-media/` — deterministic placeholder images used by mock data.
