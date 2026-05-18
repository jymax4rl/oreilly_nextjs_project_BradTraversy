import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const mdPath = path.join(root, "docs", "availability-calendar-design.md");
const pdfPath = path.join(root, "docs", "availability-calendar-design.pdf");

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const LINE = 13;
const MAX_W = PAGE_W - MARGIN * 2;

function wrapText(text, font, size) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > MAX_W) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function main() {
  const md = fs.readFileSync(mdPath, "utf8");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const addPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };

  const sanitize = (s) =>
    s
      .replace(/\u2192/g, "->")
      .replace(/\u2014/g, "-")
      .replace(/[^\x00-\xFF]/g, "?");

  const drawLine = (text, opts = {}) => {
    text = sanitize(text);
    const size = opts.size ?? 10;
    const f = opts.bold ? bold : opts.mono ? mono : font;
    const lines = opts.mono
      ? text.split("\n")
      : wrapText(text, f, size);

    for (const ln of lines) {
      if (y < MARGIN + LINE) addPage();
      page.drawText(ln, {
        x: MARGIN,
        y,
        size,
        font: f,
        color: rgb(0.12, 0.16, 0.22),
      });
      y -= size + 4;
    }
  };

  const blocks = md.split(/\n(?=#{1,3} )/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (!lines[0]) continue;

    if (lines[0].startsWith("# ")) {
      y -= 8;
      drawLine(lines[0].replace(/^# /, ""), { size: 16, bold: true });
      y -= 4;
      for (const l of lines.slice(1)) {
        if (l.startsWith("```")) continue;
        if (l === "```") continue;
        if (l.startsWith("|")) drawLine(l, { size: 8, mono: true });
        else if (l.trim()) drawLine(l.replace(/^[-*] /, "• "), { size: 10 });
      }
    } else if (lines[0].startsWith("## ")) {
      y -= 6;
      drawLine(lines[0].replace(/^##+ /, ""), { size: 13, bold: true });
      for (const l of lines.slice(1)) {
        if (l.startsWith("```")) {
          const code = [];
          let i = lines.indexOf(l) + 1;
          while (i < lines.length && !lines[i].startsWith("```")) {
            code.push(lines[i]);
            i++;
          }
          if (code.length) drawLine(code.join("\n"), { size: 8, mono: true });
          break;
        }
        if (l.startsWith("|")) drawLine(l, { size: 8, mono: true });
        else if (l.trim() && !l.startsWith("#")) drawLine(l.replace(/^[-*] /, "• "), { size: 9 });
      }
    } else {
      for (const l of lines) {
        if (l.trim()) drawLine(l, { size: 9 });
      }
    }
    y -= 6;
  }

  page.drawText("Kama Properties — Phase 1 Availability API", {
    x: MARGIN,
    y: 30,
    size: 8,
    font,
    color: rgb(0.4, 0.45, 0.5),
  });

  const bytes = await doc.save();
  fs.writeFileSync(pdfPath, bytes);
  console.log("Wrote", pdfPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
