/**
 * Print the property-promoter pitch deck to A4 PDF.
 * Uses local Chrome. Copies into public/marketing/ for sharing.
 */
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { mkdtempSync, rmSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const publicDir = join(appRoot, "public", "marketing");
const html = join(appRoot, "docs", "isisel-promoter-pitch.html");
const pdf = join(appRoot, "docs", "isisel-promoter-pitch.pdf");

const browsers = [
  process.env.CHROME_PATH,
  "/usr/local/bin/google-chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const chrome = browsers.find((p) => existsSync(p));
if (!chrome) {
  console.error("Chrome or Edge not found. Set CHROME_PATH.");
  process.exit(1);
}

mkdirSync(publicDir, { recursive: true });

if (!existsSync(html)) {
  console.error(`Missing ${html}`);
  process.exit(1);
}

const profileDir = mkdtempSync(join(tmpdir(), "isisel-pdf-"));
const htmlUrl = pathToFileURL(html).href;
const args = [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--no-first-run",
  "--no-default-browser-check",
  "--no-pdf-header-footer",
  `--user-data-dir=${profileDir}`,
  "--virtual-time-budget=15000",
  "--run-all-compositor-stages-before-draw",
  `--print-to-pdf=${pdf}`,
  htmlUrl,
];

const child = spawn(chrome, args, { stdio: "inherit" });

const watchdog = setTimeout(() => {
  if (existsSync(pdf)) {
    console.warn("Chrome still running after PDF write — stopping process.");
    child.kill("SIGTERM");
  }
}, 25000);

function finish(code) {
  clearTimeout(watchdog);
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  if (!existsSync(pdf)) {
    console.error(`Print failed (${code}): missing ${pdf}`);
    process.exit(1);
  }
  copyFileSync(pdf, join(publicDir, "isisel-promoter-pitch.pdf"));
  console.log("Wrote", pdf);
  console.log("Copied", join(publicDir, "isisel-promoter-pitch.pdf"));
  process.exit(0);
}

child.on("exit", finish);
child.on("error", (err) => {
  clearTimeout(watchdog);
  console.error(err);
  process.exit(1);
});
