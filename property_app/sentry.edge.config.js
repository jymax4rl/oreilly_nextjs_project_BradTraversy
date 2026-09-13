/**
 * Sentry Edge runtime init (middleware / edge route handlers).
 * Loaded from instrumentation.js when NEXT_RUNTIME === "edge".
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
  sendDefaultPii: false,
});
