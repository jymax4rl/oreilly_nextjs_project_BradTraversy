/**
 * Print the French Horizon 2BHK brochure to A4 PDF.
 * Usage: node scripts/generate-horizon-2bhk-pdf.mjs
 */
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const htmlPath = join(appRoot, "docs", "horizon-2bhk-brochure.html");
const pdfPath = join(appRoot, "docs", "horizon-2bhk-brochure.pdf");

if (!existsSync(htmlPath)) {
  console.error("Missing:", htmlPath);
  process.exit(1);
}

const browsers = [
  process.env.CHROME_PATH,
  "/usr/local/bin/google-chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const chrome = browsers.find((p) => existsSync(p));
if (!chrome) {
  console.error("Chrome not found. Set CHROME_PATH.");
  process.exit(1);
}

const htmlUrl = pathToFileURL(htmlPath).href;
const args = [
  "--headless",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--no-pdf-header-footer",
  "--no-first-run",
  "--disable-background-networking",
  "--disable-extensions",
  "--disable-sync",
  "--disable-default-apps",
  `--user-data-dir=/tmp/chrome-horizon-pdf`,
  "--virtual-time-budget=15000",
  `--print-to-pdf=${pdfPath}`,
  htmlUrl,
];

const child = spawn(chrome, args, { stdio: "inherit" });
child.on("exit", (code) => {
  if (code !== 0) {
    console.error(`Print failed (${code})`);
    process.exit(code || 1);
  }
  console.log("Wrote", pdfPath);
});
