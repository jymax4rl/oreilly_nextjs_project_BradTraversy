/**
 * Print docs/kama-early-bird-host.html to a designed A4 PDF.
 * Uses local Chrome/Edge (no extra npm dependency).
 */
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const htmlPath = join(appRoot, "docs", "kama-early-bird-host.html");
const pdfPath = join(appRoot, "docs", "kama-early-bird-host.pdf");

const browsers = [
  process.env.CHROME_PATH,
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
  "--disable-gpu",
  "--no-pdf-header-footer",
  "--virtual-time-budget=12000",
  `--print-to-pdf=${pdfPath}`,
  htmlUrl,
];

const child = spawn(chrome, args, { stdio: "inherit" });
child.on("exit", (code) => {
  if (code !== 0) {
    console.error("Print failed with code", code);
    process.exit(code || 1);
  }
  console.log("Wrote", pdfPath);
});
