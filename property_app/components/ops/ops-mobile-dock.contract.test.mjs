/**
 * Contract tests for the approved ops mobile dock (2026-09-10).
 * Guards against regressing to position:fixed / content-footer chrome.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, rel), "utf8");

describe("ops mobile dock contract (approved 2026-09-10)", () => {
  it("OpsShell keeps dock as in-flow sibling after scroll main", () => {
    const src = read("OpsShell.jsx");
    assert.match(src, /className="ops-app"/);
    assert.match(src, /className="ops-app-main"/);
    assert.match(src, /<OpsMobileDock\s*\/>/);
    const mainIdx = src.indexOf("ops-app-main");
    const dockIdx = src.indexOf("<OpsMobileDock");
    assert.ok(
      mainIdx > -1 && dockIdx > mainIdx,
      "dock must render after ops-app-main",
    );
    assert.match(src, /APPROVED 2026-09-10/);
  });

  it("dock CSS stays in-flow (no position:fixed on .ops-dock)", () => {
    const css = read("ops-mobile-dock.css");
    assert.match(css, /APPROVED 2026-09-10/);
    assert.match(css, /\.ops-dock\s*\{[^}]*flex:\s*0\s+0\s+auto/s);
    assert.match(css, /padding-bottom:\s*env\(safe-area-inset-bottom/);
    assert.match(css, /--ops-dock-bg:\s*#0c0c0c/);
    assert.match(css, /--ops-dock-accent:\s*#2f8f86/);
    const dockBlock = css.match(/\.ops-dock\s*\{[^}]+\}/s)?.[0] || "";
    assert.doesNotMatch(dockBlock, /position:\s*fixed/);
  });

  it("ops-app shell locks viewport and scrolls only main", () => {
    const css = read("charts/ops-charts.css");
    assert.match(css, /\.ops-app\s*\{[^}]*display:\s*flex/s);
    assert.match(css, /\.ops-app\s*\{[^}]*overflow:\s*hidden/s);
    assert.match(css, /\.ops-app-main\s*\{[^}]*overflow-y:\s*auto/s);
  });

  it("primary mobile tabs stay Home / Stats / Listings / Stays", () => {
    const items = read("opsNavItems.js");
    assert.match(items, /OPS_MOBILE_TABS/);
    assert.match(items, /shortLabel:\s*"Stats"/);
    assert.match(items, /shortLabel:\s*"Stays"/);
    const tabCount = (items.match(/^\s*mobile:\s*"tab"/gm) || []).length;
    assert.equal(tabCount, 4);
  });

  it("MainShell viewport-locks ops routes without trapping host scroll", () => {
    const src = read("../MainShell.jsx");
    assert.match(src, /opsViewport/);
    assert.match(src, /h-dvh/);
    assert.match(src, /\/ops\/login/);
  });
});
