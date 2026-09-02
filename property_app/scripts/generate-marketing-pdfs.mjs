/**
 * Print MVP marketing decks (host + influencer) to A4 PDF.
 * Uses local Chrome/Edge. Copies into public/marketing/ for ops attachments.
 */
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const publicDir = join(appRoot, "public", "marketing");

const jobs = [
  {
    html: join(appRoot, "docs", "kama-mvp-host-pitch.html"),
    pdf: join(appRoot, "docs", "kama-mvp-host-pitch.pdf"),
  },
  {
    html: join(appRoot, "docs", "kama-mvp-influencer-stay.html"),
    pdf: join(appRoot, "docs", "kama-mvp-influencer-stay.pdf"),
  },
];

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

mkdirSync(publicDir, { recursive: true });

function printOne(htmlPath, pdfPath) {
  if (!existsSync(htmlPath)) {
    return Promise.reject(new Error(`Missing ${htmlPath}`));
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
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Print failed (${code}): ${pdfPath}`));
        return;
      }
      copyFileSync(pdfPath, join(publicDir, pdfPath.split(/[/\\]/).pop()));
      console.log("Wrote", pdfPath);
      resolve();
    });
  });
}

async function main() {
  for (const job of jobs) {
    await printOne(job.html, job.pdf);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
