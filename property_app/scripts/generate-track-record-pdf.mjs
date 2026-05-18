/**
 * Generates docs/kama-properties-track-record.pdf from HTML.
 * Usage: npm run docs:track-record-pdf
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const htmlPath = join(appRoot, "docs", "kama-properties-track-record.html");
const pdfPath = join(appRoot, "docs", "kama-properties-track-record.pdf");

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
