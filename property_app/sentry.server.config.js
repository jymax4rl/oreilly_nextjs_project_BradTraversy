/**
 * Sentry Node.js runtime init (Server Components, Route Handlers, SSR).
 * Loaded from instrumentation.js when NEXT_RUNTIME === "nodejs".
 */
import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "";

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment:
    process.env.SENTRY_ENVIRONMENT ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development",
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  // Keep PII off by default; enable explicitly if product needs it.
  sendDefaultPii: false,
});
