/**
 * Print Isisel stack architecture deck to A4 PDF.
 * Uses local Chrome/Edge. Copies into public/marketing/.
 */
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const publicDir = join(appRoot, "public", "marketing");

const htmlPath = join(appRoot, "docs", "isisel-stack-architecture.html");
const pdfPath = join(appRoot, "docs", "isisel-stack-architecture.pdf");

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
  console.error(`Missing ${htmlPath}`);
  process.exit(1);
}

mkdirSync(publicDir, { recursive: true });

const htmlUrl = pathToFileURL(htmlPath).href;
const args = [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  "--virtual-time-budget=30000",
  `--print-to-pdf=${pdfPath}`,
  htmlUrl,
];

await new Promise((resolve, reject) => {
  const child = spawn(chrome, args, { stdio: "inherit" });
  child.on("exit", (code) => {
    if (code !== 0) {
      reject(new Error(`Print failed (${code}): ${pdfPath}`));
      return;
    }
    resolve();
  });
});

copyFileSync(pdfPath, join(publicDir, "isisel-stack-architecture.pdf"));
console.log("Wrote", pdfPath);
console.log("Copied to public/marketing/isisel-stack-architecture.pdf");
