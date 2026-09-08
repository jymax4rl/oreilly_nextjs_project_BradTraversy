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

async function printWithPuppeteer() {
  try {
    const puppeteer = await import("puppeteer-core");
    const browser = await puppeteer.default.launch({
      executablePath: chrome,
      headless: true,
      args: ["--no-sandbox", "--disable-gpu"],
    });
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, {
      waitUntil: "networkidle0",
      timeout: 120000,
    });
    await page.emulateMediaType("print");
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
    await browser.close();
    console.log("Wrote", pdfPath, "(puppeteer-core)");
    return true;
  } catch {
    return false;
  }
}

async function printWithChromeCli() {
  const htmlUrl = pathToFileURL(htmlPath).href;
  const args = [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=60000",
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
  console.log("Wrote", pdfPath, "(chrome cli)");
}

if (!(await printWithPuppeteer())) {
  await printWithChromeCli();
}
