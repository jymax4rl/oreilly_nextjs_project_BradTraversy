import OpsNav from "@/components/ops/OpsNav";
import "@/components/ops/charts/ops-charts.css";

export default function OpsShell({
  children,
  title,
  subtitle,
  variant = "default",
}) {
  const marketing = variant === "marketing";

  return (
    <div
      className={`ops-app min-h-dvh text-[var(--kama-ink)] ${
        marketing ? "ops-app--marketing" : ""
      }`}
    >
      <OpsNav />
      <div className="ops-app-main">
        <div
          className={`ops-app-inner ${marketing ? "ops-app-inner--marketing" : ""}`}
        >
          {(title || subtitle) && (
            <header className={`mb-8 ${marketing ? "ops-marketing-hero" : "max-w-2xl"}`}>
              {title ? (
                <h1
                  className={
                    marketing
                      ? "text-[1.9rem] font-bold tracking-tight text-white sm:text-4xl"
                      : "text-[1.75rem] font-bold tracking-tight text-[var(--kama-ink)] sm:text-3xl"
                  }
                >
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p
                  className={
                    marketing
                      ? "mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base"
                      : "mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]"
                  }
                >
                  {subtitle}
                </p>
              ) : null}
            </header>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
