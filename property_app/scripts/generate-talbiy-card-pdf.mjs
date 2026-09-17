/**
 * Print Talbiy Cisse visiting card (85 × 55 mm, recto + verso).
 * Usage: node scripts/generate-talbiy-card-pdf.mjs
 */
import { existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const jobs = [
  {
    html: join(appRoot, "docs", "talbiy-cisse-carte.html"),
    pdf: join(appRoot, "docs", "talbiy-cisse-carte.pdf"),
  },
  {
    html: join(appRoot, "docs", "talbiy-cisse-carte-a4.html"),
    pdf: join(appRoot, "docs", "talbiy-cisse-carte-a4.pdf"),
  },
];

if (jobs.some((job) => !existsSync(job.html))) {
  console.error("Missing card HTML.");
  process.exit(1);
}

const browsers = [
  process.env.CHROME_PATH,
  "/usr/local/bin/google-chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);
const chrome = browsers.find((p) => existsSync(p));
if (!chrome) {
  console.error("Chrome not found. Set CHROME_PATH.");
  process.exit(1);
}

mkdirSync("/tmp/chrome-talbiy-card", { recursive: true });

function printOne(htmlPath, pdfPath) {
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
    "--user-data-dir=/tmp/chrome-talbiy-card",
    "--virtual-time-budget=12000",
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: "inherit" });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, 25000);
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (!existsSync(pdfPath)) {
        reject(new Error(`Print failed (${code}): ${pdfPath}`));
        return;
      }
      console.log("Wrote", pdfPath);
      resolve();
    });
  });
}

for (const job of jobs) {
  await printOne(job.html, job.pdf);
}
