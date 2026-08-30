/**
 * Runtime marker so Docker vs Vercel (vs plain local next) are visually distinct.
 * Vercel sets VERCEL=1; our Docker image sets APP_VERSION (e.g. 1.1.0).
 */
export default function DeployCheckBadge({ surface = "dark" }) {
  const isVercel = process.env.VERCEL === "1";
  const appVersion = process.env.APP_VERSION || "";
  const isDocker = Boolean(appVersion) && !isVercel;

  const minor =
    appVersion && /^\d+\.\d+/.test(appVersion)
      ? appVersion.split(".").slice(0, 2).join(".")
      : appVersion || "1.1";

  if (isVercel) {
    const envLabel = process.env.VERCEL_ENV || "production";
    const base =
      surface === "light"
        ? "border border-zinc-400 bg-white/95 text-zinc-700 shadow-sm"
        : "border border-zinc-500 text-zinc-400";
    return (
      <span
        aria-hidden="true"
        className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${base}`}
      >
        Vercel · {envLabel}
      </span>
    );
  }

  if (isDocker) {
    const base =
      surface === "light"
        ? "border-2 border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm"
        : "border-2 border-emerald-400/90 bg-emerald-950 text-emerald-300";
    return (
      <span
        aria-hidden="true"
        className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${base}`}
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            surface === "light" ? "bg-emerald-600" : "bg-emerald-400"
          }`}
        />
        Docker · v{minor} · container
      </span>
    );
  }

  // npm run dev / unset runtime
  const base =
    surface === "light"
      ? "border border-amber-500 bg-amber-50 text-amber-950 shadow-sm"
      : "border border-amber-500/80 text-amber-300";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${base}`}
    >
      Local · next dev
    </span>
  );
}
