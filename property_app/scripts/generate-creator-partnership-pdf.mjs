/**
 * Print Creator Partnership product specification to A4 PDF via local Chrome.
 * Input:  docs/ISISel_Creator_Partnership_System.html
 * Output: docs/ISISel_Creator_Partnership_System.pdf
 *
 * Usage: node scripts/generate-creator-partnership-pdf.mjs
 * Optional: CHROME_PATH=/path/to/chrome node scripts/generate-creator-partnership-pdf.mjs
 */
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const htmlPath = join(appRoot, "docs", "ISISel_Creator_Partnership_System.html");
const pdfPath = join(appRoot, "docs", "ISISel_Creator_Partnership_System.pdf");

const browsers = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/local/bin/google-chrome",
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

if (!existsSync(htmlPath)) {
  console.error("Missing:", htmlPath);
  process.exit(1);
}

const htmlUrl = pathToFileURL(htmlPath).href;
const args = [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--no-pdf-header-footer",
  "--virtual-time-budget=30000",
  `--print-to-pdf=${pdfPath}`,
  htmlUrl,
];

const child = spawn(chrome, args, { stdio: "inherit" });
child.on("exit", (code) => {
  if (code !== 0) {
    console.error(`Print failed (${code}): ${pdfPath}`);
    process.exit(code || 1);
  }
  console.log("Wrote", pdfPath);
});
