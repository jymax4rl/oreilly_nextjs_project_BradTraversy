"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * App Router root error boundary. Required for Sentry to capture
 * React render errors that escape segment-level error.jsx boundaries.
 * Kept visually close to the existing app/error.jsx UX.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16">
          <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-zinc-900">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              The page hit an unexpected error. Try again — if you just
              deployed, a hard refresh may be needed.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
