import OpsNav from "@/components/ops/OpsNav";
import "@/components/ops/charts/ops-charts.css";

export default function OpsShell({ children, title, subtitle }) {
  return (
    <div className="min-h-dvh bg-[var(--kama-canvas-soft)] text-[var(--kama-ink)]">
      <OpsNav />
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        {(title || subtitle) && (
          <header className="mb-8 max-w-2xl">
            {title ? (
              <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--kama-ink)] sm:text-3xl">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
                {subtitle}
              </p>
            ) : null}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
