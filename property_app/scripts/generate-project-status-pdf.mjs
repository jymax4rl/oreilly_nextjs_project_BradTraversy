/**
 * Generates docs/kama-properties-project-status.pdf from HTML.
 * Usage: npm run docs:project-status-pdf
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const htmlPath = join(appRoot, "docs", "kama-properties-project-status.html");
const pdfPath = join(appRoot, "docs", "kama-properties-project-status.pdf");

if (!existsSync(htmlPath)) {
  console.error("Missing:", htmlPath);
  process.exit(1);
}

const puppeteer = await import("puppeteer");
const browser = await puppeteer.default.launch({ headless: true });
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
});
await browser.close();
console.log("Wrote", pdfPath);
