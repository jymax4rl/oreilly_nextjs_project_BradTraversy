import OpsNav from "@/components/ops/OpsNav";
import OpsMobileDock from "@/components/ops/OpsMobileDock";
import "@/components/ops/charts/ops-charts.css";

/**
 * Ops viewport shell:
 * [top bar] + [scrollable main] + [in-flow bottom dock]
 * Dock is a flex sibling, not position:fixed — stays on the screen bottom in PWA.
 */
export default function OpsShell({ children, title, subtitle, wide, copilot }) {
  return (
    <div className="ops-app">
      <OpsNav />
      <div className="ops-app-main">
        <div
          className={`ops-app-inner ${wide ? "ops-app-inner--wide" : ""} ${
            copilot ? "ops-app-inner--copilot" : ""
          }`}
        >
          {(title || subtitle) && (
            <header className="ops-page-head">
              {title ? <h1>{title}</h1> : null}
              {subtitle ? <p>{subtitle}</p> : null}
            </header>
          )}
          {children}
        </div>
      </div>
      <OpsMobileDock />
    </div>
  );
}
