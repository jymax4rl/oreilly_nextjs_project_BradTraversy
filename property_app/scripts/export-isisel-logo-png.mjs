/**
 * Rasterize the real Isisel SVG mark to PNG (not an AI redraw).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, unlinkSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const svgSrc = join(appRoot, "assets", "images", "Kama logo - teal.svg");
const outPng = join(appRoot, "public", "brand", "isisel-logo.png");
const outSvg = join(appRoot, "public", "brand", "isisel-logo.svg");
const marketingPng = join(appRoot, "public", "marketing", "isisel-logo.png");
const marketingSvg = join(appRoot, "public", "marketing", "isisel-logo.svg");

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

if (!existsSync(svgSrc)) {
  console.error("Missing", svgSrc);
  process.exit(1);
}

const svg = readFileSync(svgSrc, "utf8");
mkdirSync(join(appRoot, "public", "brand"), { recursive: true });
mkdirSync(join(appRoot, "public", "marketing"), { recursive: true });
writeFileSync(outSvg, svg);
copyFileSync(outSvg, marketingSvg);

const htmlPath = join(tmpdir(), "isisel-logo-export.html");
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin: 0;
      width: 1024px;
      height: 1024px;
      background: #ffffff;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      width: 780px;
      height: auto;
    }
  </style>
</head>
<body>
  ${svg}
</body>
</html>`;
writeFileSync(htmlPath, html);

const args = [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--window-size=1024,1024",
  "--default-background-color=ffffffff",
  `--screenshot=${outPng}`,
  pathToFileURL(htmlPath).href,
];

await new Promise((resolve, reject) => {
  const child = spawn(chrome, args, { stdio: "inherit" });
  child.on("exit", (code) => {
    if (code !== 0) {
      reject(new Error(`Screenshot failed (${code})`));
      return;
    }
    resolve();
  });
});

try {
  unlinkSync(htmlPath);
} catch {
  /* ignore */
}

copyFileSync(outPng, marketingPng);
console.log("Wrote", outPng);
console.log("Wrote", marketingPng);
