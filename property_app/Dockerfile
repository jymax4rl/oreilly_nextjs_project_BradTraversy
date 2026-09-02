# Isisel — production Next.js image (standalone)
# Build context: property_app/
#
# Preferred (versioned tags from VERSION file, e.g. 1.1.0 → :1.1.0 and :1.1):
#   npm run docker:release
#
# Manual:
#   docker build -t kama-properties:1.1.0 --build-arg APP_VERSION=1.1.0 .
#   docker tag kama-properties:1.1.0 kama-properties:1.1
#
# Run (secrets via env / orchestrator — never bake into layers):
#   docker run --rm -p 3000:3000 --env-file .env.local kama-properties:1.1

# -----------------------------------------------------------------------------
# Stage 1 — dependencies
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Puppeteer is a host-only PDF tool (devDependency) — never download browsers in CI/images.
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2 — build
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Public env is inlined into the client bundle at build time.
# Pass via --build-arg (or leave empty and rely on runtime for server-only vars).
# Maps: runtime --env-file does NOT inject NEXT_PUBLIC_* into the browser bundle.
# Pass GOOGLE_MAPS_API_KEY and/or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as build-args.
# next.config.mjs maps GOOGLE_MAPS_API_KEY → NEXT_PUBLIC_GOOGLE_MAPS_API_KEY at build.
ARG NEXT_PUBLIC_SITE_URL=https://www.isisel.com
ARG NEXT_PUBLIC_DOMAIN=https://www.isisel.com
ARG NEXT_PUBLIC_APP_URL=https://www.isisel.com
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
ARG NEXT_PUBLIC_CURRENCY_EXCHANGE_RATE_API=
ARG NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ARG GOOGLE_MAPS_API_KEY=
ARG NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=
ARG GOOGLE_MAPS_MAP_ID=
ARG APP_VERSION=0.0.0

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_DOMAIN=$NEXT_PUBLIC_DOMAIN \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME \
    NEXT_PUBLIC_CURRENCY_EXCHANGE_RATE_API=$NEXT_PUBLIC_CURRENCY_EXCHANGE_RATE_API \
    NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=$NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
    GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY \
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=$NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID \
    GOOGLE_MAPS_MAP_ID=$GOOGLE_MAPS_MAP_ID \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    APP_VERSION=$APP_VERSION

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3 — production runner
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ARG APP_VERSION=0.0.0
ARG APP_CHANNEL=

LABEL org.opencontainers.image.title="Isisel" \
      org.opencontainers.image.description="African vacation rentals marketplace" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.source="https://github.com/jymax4rl/oreilly_nextjs_project_BradTraversy"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    APP_VERSION=$APP_VERSION \
    APP_CHANNEL=$APP_CHANNEL

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone server + static assets + public
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Drop any env files that Next may have copied into standalone during local builds
RUN rm -f .env .env.local .env.production .env.development || true

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
