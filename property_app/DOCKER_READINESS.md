# Docker readiness contract — Isisel (`property_app`)

Prepared for containerisation.

**Implemented:** `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `VERSION`, `scripts/docker-release.mjs`.

## Versioning (SemVer)

Single source of truth: **`VERSION`** (kept in sync with `package.json` version).

| File / tag | Example for release **1.1.0** |
|------------|-------------------------------|
| `VERSION` / `package.json` | `1.1.0` |
| Exact image tag | `kama-properties:1.1.0` |
| Minor line (“version **1.1**”) | `kama-properties:1.1` |
| Moving tip | `kama-properties:latest` |

```bash
# from property_app/

# Preview tags without building
npm run docker:plan

# Build + apply :1.1.0, :1.1, and :latest (reads VERSION)
npm run docker:release

# Optional public build-args after --
npm run docker:release -- -- --build-arg NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud

# MVP local tag (also tags kama-properties:mvp). Maps key is picked up from .env.local.
npm run docker:release -- --tag mvp

# Bump to the next release, then build (updates VERSION + package.json)
npm run docker:bump -- 1.2.0

# Run the minor line (or exact / mvp). Runtime env_file is for server secrets only.
docker run --rm -p 3000:3000 --env-file .env.local -e NEXTAUTH_URL=http://localhost:3000 kama-properties:mvp
# or: docker compose up
# then: curl http://localhost:3000/api/health
```

**Bump rules:** patch `1.1.0` → `1.1.1` (fixes); minor `1.1.0` → `1.2.0` (features); major `2.0.0` (breaking). Always ship the three tags so operators can pin `:1.1` or lock `:1.1.0`.

Push to a registry:

```bash
node scripts/docker-release.mjs --push ghcr.io/your-org
```

---

## Application

| Item | Value |
|------|--------|
| Framework | Next.js 16 App Router (`next` ^16.2.6), React 19 |
| App root | `oreilly_nextjs_project_BradTraversy/property_app/` |
| Node version | **≥ 20.9.0** (`engines` in `package.json`; local audit used v24.11.1) |
| Package manager | **npm** (lockfile: `package-lock.json`) |
| Install | `npm ci` |
| Lint | `npm run lint` |
| Typecheck | `npx tsc --noEmit` (no dedicated script; `tsconfig` has `noEmit: true`) |
| Build | `npm run build` |
| Start | `npm run start` (or `node server.js` from `.next/standalone` when using standalone) |
| Application port | **3000** (`PORT` overrides; bind `0.0.0.0` in containers) |
| Health check | `GET /api/health` → `{ status: "ok", service, version }` (no DB) |
| Standalone output | **Enabled** (`output: "standalone"` in `next.config.mjs`) |

---

## Environment

### Public (`NEXT_PUBLIC_*` — baked into client bundles at build time)

| Variable | Required | Sensitive | Used where |
|----------|----------|-----------|------------|
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | No | SEO, layout, sitemap, robots, property pages |
| `NEXT_PUBLIC_DOMAIN` | Recommended | No | Client fetches (`utils/request.js`) |
| `NEXT_PUBLIC_APP_URL` | Recommended | No | Payments redirect/logo, app URL helper |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Recommended | No | Image URL resolution |
| `NEXT_PUBLIC_CURRENCY_EXCHANGE_RATE_API` | Optional | Treat as semi-public | Currency rates (client) |
| `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` | Yes if payments | No (public key) | Checkout UI |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or `GOOGLE_MAPS_API_KEY` | Recommended (address search) | Treat as restricted public key | Listing wizard address autocomplete + map pin (`next.config.mjs` maps `GOOGLE_MAPS_API_KEY` → `NEXT_PUBLIC_*` at **build**) |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` / `GOOGLE_MAPS_MAP_ID` | Optional | No | Advanced Markers; classic pin works without it |

**Docker note:** rebuild the image when public env values change.

**Google Maps / Places (Docker MVP):** `NEXT_PUBLIC_*` and `next.config` `env` mapping are inlined at **`next build`**. Passing the key only via `docker run --env-file .env.local` does **not** put it in the browser bundle. Dockerfile + `docker-compose` accept `GOOGLE_MAPS_API_KEY` / `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` as **build-args**. `npm run docker:release` (and `--tag mvp`) loads them from `.env.local` without printing values.

- **Missing key at build:** wizard shows a soft-fail that names the build-arg requirement; manual street/city/country still works.
- **Key present:** address search uses **Places API (New)** via `google.maps.importLibrary("places")` (AutocompleteSuggestion). Do not enable/rely on legacy Places Autocomplete. Also enable **Maps JavaScript API**, and allow HTTP referrer `http://localhost:3000/*` (plus production domains).

Rebuild command (from `property_app/`): `npm run docker:release -- --tag mvp` then recreate the `kama-localhost-3000` container from `kama-properties:mvp`.

### Server-only (never use `NEXT_PUBLIC_`)

| Variable | Required | Sensitive | Used where |
|----------|----------|-----------|------------|
| `NEXTAUTH_URL` | Yes | No | NextAuth canonical URL |
| `NEXTAUTH_SECRET` | Yes | **Yes** | NextAuth JWT |
| `GOOGLE_CLIENT_ID` | Yes | Low | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Yes | **Yes** | Google OAuth |
| `MONGODB_URI` | Yes | **Yes** | Mongoose (`config/database.js`) |
| `CLOUDINARY_URL` *or* `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` | Yes for media upload | **Yes** (secret) | Uploads / signatures |
| `FLUTTERWAVE_SECRET_KEY` | Yes if payments | **Yes** | Verify / initialize |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Yes if webhooks | **Yes** | Webhook auth |
| `EMAIL_FROM` | Optional | No | Defaults to `Isisel <contact@isisel.com>` |
| `EMAIL_REPLY_TO` | Optional | No | Reply-To |
| `RESEND_API_KEY` / `RESEND_BOOKING_API_KEY` / `RESEND_ADMIN_API_KEY` | Yes for email | **Yes** | Resend |
| `RESEND_TEMPLATE_*` / `RESEND_TEMPLATES_READY` | Optional | No | Template IDs |
| `CLOUDINARY_LEGACY_HOST_ID` | Scripts only | Low | Backfill scripts |
| `PORT` | Optional | No | Listen port (default 3000) |
| `NODE_ENV` | Set by runtime | No | `production` in containers |

See also `property_app/.env.example` (names only). Real `.env` / `.env.local` are gitignored.

---

## External services (outside the app container)

```text
Application container (Next.js)
        |
        +---- MongoDB Atlas (MONGODB_URI)
        |
        +---- Cloudinary (images / signed uploads)
        |
        +---- Google OAuth
        |
        +---- Flutterwave (payments + webhooks)
        |
        +---- Resend (transactional email)
        |
        +---- Currency exchange API (client; optional)
        |
        +---- Vercel Analytics (optional; may no-op off Vercel)
```

Do **not** put MongoDB/Cloudinary/etc. inside the app image unless product architecture changes.

Webhook requirement: Flutterwave must reach `https://<public-host>/api/payments/webhook`.

---

## Filesystem

| Path / behavior | Writable? | Notes |
|-----------------|-----------|--------|
| App code / `.next` | No (read-only OK) | Prefer read-only root FS in prod |
| `public/` | Read | Bundled static assets, brand SVG, etc. |
| `public/properties`, `public/audio/properties` | **Write if local upload fallback used** | `app/api/properties/route.js` may `writeFile` when Cloudinary is unavailable. **Ephemeral in containers** — prefer Cloudinary in production; if local fallback must work, mount a persistent volume. |
| Temp | OS temp | No special volume required for normal Cloudinary path |

---

## Networking

- Listen: `0.0.0.0:3000` (or `PORT`)
- Outbound HTTPS: MongoDB Atlas, Cloudinary, Google, Flutterwave, Resend, currency API
- Inbound: HTTP to Next; TLS terminated at reverse proxy / load balancer

---

## Assets & images

- Next `images.remotePatterns`: `images.unsplash.com`, `lh3.googleusercontent.com`, `res.cloudinary.com`
- Local property files historically under `public/properties` / `public/audio`
- Styled-components compiler enabled in Next config

---

## Dependency notes for Docker

| Package | Runtime? | Docker impact |
|---------|----------|---------------|
| `mongoose`, `mongodb` | Yes | Pure JS; needs network to Atlas |
| `cloudinary` | Yes | Pure JS |
| `next-auth`, `resend` | Yes | Pure JS |
| `sharp` (Next image) | Transitive | Alpine may need `libc6-compat`; if issues, use `node:20-bookworm-slim` |
| `puppeteer` | **devDependency** (PDF scripts) | **Not required** in production runtime image |
| `mongoos` | Listed in dependencies | Placeholder/security stub — do not rely on; keep until intentionally removed |
| `async_hooks` npm package | Yes (odd) | Webpack fallback disables Node `async_hooks` for client; leave as-is |

No Chromium/Python required for the **runtime** container.

---

## Docker strategy (next phase — not implemented yet)

### Base image

Prefer:

```text
node:20-alpine
```

Fallback if sharp/native issues:

```text
node:20-bookworm-slim
```

### Multi-stage build

1. **deps** — `npm ci`
2. **build** — copy source, set build-time `NEXT_PUBLIC_*`, `npm run build`
3. **runner** — copy `.next/standalone`, `.next/static`, `public`; run as non-root; `NODE_ENV=production`; `HOSTNAME=0.0.0.0`

### Standalone layout (after build)

```text
.next/standalone/     → app server (includes minimal node_modules)
.next/static/         → copy to standalone/.next/static
public/               → copy to standalone/public
```

Start (typical):

```text
node server.js
```

from the standalone output directory.

### Production user

Run as non-root (e.g. `nextjs` UID 1001).

### System packages

- Alpine: often `libc6-compat` for Next/sharp
- No puppeteer/Chrome in runtime image

### Healthcheck

```text
GET /api/health
```

---

## Localhost / path audit (no blind replacements)

| Occurrence | Role |
|------------|------|
| `utils/appUrl.js` → `http://localhost:${PORT}` | Dev-only when `NODE_ENV !== production` |
| Property canonical fallback | Now `https://www.isisel.com` (was localhost) |
| `writeFile` under `public/` | Prod-relevant only if Cloudinary fallback used |
| Scripts under `scripts/` | Ops/CLI; not container start path |

---

## Validation checklist (pre-Dockerfile)

- [x] `engines.node` declared
- [x] `output: "standalone"`
- [x] `.env.example` (no secrets)
- [x] `.env*` gitignored; `!.env.example`
- [x] `/api/health`
- [x] `npx tsc --noEmit` — PASS (2026-08-29)
- [x] `npm run build` — PASS; routes include `/api/health`; standalone emitted
- [x] Standalone smoke: `node server.js` on port 3010 → `/api/health` 200, `/` 200
- [ ] `npm run lint` — FAIL with **pre-existing** eslint errors (not in Docker-critical path; `next build` does not require lint). Do not block image build on lint until cleaned separately.
- [x] Confirm `.next/standalone` contains `server.js`, `public/`, nested `.next/`

### Sharp note (Windows standalone smoke)

On Windows, standalone start logged that `sharp` native binding failed to load; HTML still returned 200. **Linux Docker images** should install platform-matching `sharp` (Next usually pulls optional deps during `npm ci` on the build stage). Prefer `node:20-bookworm-slim` if Alpine + sharp fails.

### Secrets in standalone output

Next may copy `.env` into `.next/standalone` during local builds. **Never ship that directory as an image layer with real secrets.** Future `.dockerignore` must exclude `.env*`; inject runtime env via orchestrator.

---

## Out of scope (do not block Docker image creation, but block “pay real clients”)

Payment metadata trust, webhook hashing, legal pages, etc. are product/security launch items — see prior launch audit. They do not prevent building a container that runs the Next process.
