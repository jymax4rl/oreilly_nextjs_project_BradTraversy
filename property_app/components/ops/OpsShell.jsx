import OpsNav from "@/components/ops/OpsNav";
import "@/components/ops/charts/ops-charts.css";

export default function OpsShell({ children, title, subtitle, wide, copilot }) {
  return (
    <div className="ops-app min-h-dvh">
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
    </div>
  );
}
