import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for multi-stage Docker images (copy .next/standalone + static + public).
  output: "standalone",
  // Vercel often stores the key as GOOGLE_MAPS_API_KEY (no NEXT_PUBLIC_).
  // Maps JS runs in the browser, so expose whichever name is set at build time.
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      "",
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ||
      process.env.GOOGLE_MAPS_MAP_ID ||
      "",
  },
  compiler: {
    styledComponents: true,
  },
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "**",
      },
    ],
  },
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/insvestors",
        destination: "/investors",
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      async_hooks: false,
    };
    return config;
  },
  async headers() {
    const iconCache = "public, max-age=86400, stale-while-revalidate=604800";
    const iconSources = [
      "/apple-touch-icon.png",
      "/apple-touch-icon-precomposed.png",
      "/apple-touch-icon-120x120.png",
      "/apple-touch-icon-152x152.png",
      "/apple-touch-icon-167x167.png",
      "/apple-touch-icon-180x180.png",
    ];
    return [
      ...iconSources.map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: iconCache }],
      })),
      {
        source: "/icons/:file",
        headers: [{ key: "Cache-Control", value: iconCache }],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default withSentryConfig(nextConfig, {
  // Matches Sentry org/project from the Configure Next.js SDK wizard.
  org: process.env.SENTRY_ORG || "isisel",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",

  // Quiet locally; verbose in CI when uploading.
  silent: !process.env.CI,

  // Upload a larger set of client source maps for clearer stack traces.
  widenClientFileUpload: true,

  // Proxy browser events through the Next app (helps with ad blockers).
  tunnelRoute: "/monitoring",

  // Tree-shake Sentry debug logger statements from production bundles.
  disableLogger: true,

  // Create Sentry cron monitors from vercel.json crons when present.
  automaticVercelMonitors: true,

  // Do not fail / block builds when auth token is missing (local + CI without secrets).
  // Set SENTRY_AUTH_TOKEN on Vercel to enable release + source map upload.
  sourcemaps: {
    disable: !hasSentryAuthToken,
  },
  release: {
    create: hasSentryAuthToken,
  },
});
