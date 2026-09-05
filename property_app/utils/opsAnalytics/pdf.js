import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const TEAL = rgb(0.106, 0.361, 0.341);
const INK = rgb(0.047, 0.102, 0.102);
const MUTED = rgb(0.29, 0.36, 0.357);
const LINE = rgb(0.925, 0.925, 0.925);

function money(n) {
  return `USD ${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function num(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function delta(pct) {
  if (pct == null) return "n/a";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

export async function buildAnalyticsPdf(report) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensure = (need = 24) => {
    if (y < MARGIN + need) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const text = (str, opts = {}) => {
    const size = opts.size || 10;
    const f = opts.bold ? bold : font;
    const color = opts.color || INK;
    const maxW = opts.maxW || PAGE_W - MARGIN * 2;
    const words = String(str || "").split(/\s+/);
    let line = "";
    const flush = () => {
      if (!line) return;
      ensure(size + 4);
      page.drawText(line, { x: opts.x || MARGIN, y, size, font: f, color });
      y -= size + (opts.gap || 5);
      line = "";
    };
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(test, size) > maxW) {
        flush();
        line = word;
      } else {
        line = test;
      }
    }
    flush();
  };

  const heading = (str) => {
    y -= 8;
    ensure(28);
    text(str, { bold: true, size: 13, color: TEAL, gap: 8 });
  };

  const kv = (label, value, extra = "") => {
    ensure(16);
    page.drawText(label, { x: MARGIN, y, size: 9, font, color: MUTED });
    page.drawText(String(value), {
      x: MARGIN + 220,
      y,
      size: 10,
      font: bold,
      color: INK,
    });
    if (extra) {
      page.drawText(extra, { x: MARGIN + 360, y, size: 9, font, color: MUTED });
    }
    y -= 16;
  };

  const drawSpark = (series, caption) => {
    const points = (series || []).slice(-36);
    if (points.length < 2) return;
    const values = points.map((p) => Number(p.value) || 0);
    const max = Math.max(...values, 1);
    const chartW = PAGE_W - MARGIN * 2;
    const chartH = 56;
    ensure(chartH + 18);
    y -= 6;
    page.drawText(caption, { x: MARGIN, y, size: 8, font, color: MUTED });
    y -= 10;
    const barW = Math.max(1.5, chartW / points.length - 1.2);
    points.forEach((point, i) => {
      const h = (values[i] / max) * chartH;
      page.drawRectangle({
        x: MARGIN + i * (chartW / points.length),
        y: y - chartH,
        width: barW,
        height: Math.max(0.6, h),
        color: TEAL,
      });
    });
    y -= chartH + 10;
  };

  try {
    const cwd = process.cwd();
    const logoCandidates = [
      path.join(cwd, "public/icons/icon-192.png"),
      path.join(cwd, "property_app/public/icons/icon-192.png"),
    ];
    let bytes = null;
    for (const logoPath of logoCandidates) {
      try {
        bytes = await fs.readFile(logoPath);
        break;
      } catch {
        /* try next path */
      }
    }
    const png = bytes ? await doc.embedPng(bytes).catch(() => null) : null;
    if (png) {
      const w = 72;
      const h = (png.height / png.width) * w;
      page.drawImage(png, {
        x: MARGIN,
        y: y - h + 8,
        width: w,
        height: h,
      });
      y -= h + 12;
    }
  } catch {
    /* brand mark is optional */
  }

  text("ISISEL", { bold: true, size: 18, color: TEAL, gap: 4 });
  text("Operations analytics report", { bold: true, size: 16, gap: 6 });
  text(`Period: ${report.range.label} (UTC)`, { size: 10, color: MUTED, gap: 3 });
  if (report.range.previousLabel) {
    text(`Compared with: ${report.range.previousLabel}`, {
      size: 10,
      color: MUTED,
      gap: 3,
    });
  }
  text(`Generated: ${new Date(report.generatedAt).toISOString()}`, {
    size: 9,
    color: MUTED,
    gap: 12,
  });

  heading("Executive overview");
  const overview = [
    ["Users", report.kpis.users, false],
    ["Hosts", report.kpis.hosts, false],
    ["Properties", report.kpis.properties, false],
    ["Reservations (period)", report.kpis.reservations, false],
    ["Booking value managed", report.kpis.grossBookingValue, true],
    ["Isisel commission recorded", report.kpis.isiselRevenue, true],
  ];
  for (const [label, kpi, isMoney] of overview) {
    kv(
      label,
      isMoney ? money(kpi.current) : num(kpi.current),
      `vs prior ${delta(kpi.deltaPct)}`,
    );
  }

  heading("User growth");
  kv("Total users at period end", num(report.users.total));
  kv("New users in period", num(report.users.newInPeriod), delta(report.users.growthPct));
  drawSpark(report.users.series, "Cumulative registered users");

  heading("Host growth");
  kv("Verified hosts at period end", num(report.hosts.total));
  kv("New hosts (applications approved)", num(report.hosts.newInPeriod));
  kv("Hosts with at least one property", num(report.hosts.hostsWithProperties));
  kv("Average properties per host", String(report.hosts.avgPropertiesPerHost));
  drawSpark(report.hosts.series, "Host applications approved");

  heading("Property / listing growth");
  kv("Properties at period end", num(report.properties.total));
  kv("Newly created in period", num(report.properties.newInPeriod));
  kv("Live listings (current)", num(report.properties.activeListings));
  kv("Not live (current)", num(report.properties.inactiveListings));
  drawSpark(report.properties.series, "Cumulative properties");

  heading("Reservations");
  kv("Total reservations at period end", num(report.kpis.reservations.current));
  kv("Created in this period", num(report.reservations.createdInPeriod ?? report.reservations.total));
  kv("Confirmed", num(report.reservations.confirmed), `${report.reservations.confirmationRate ?? "n/a"}%`);
  kv("Pending", num(report.reservations.pending));
  kv("Cancelled", num(report.reservations.cancelled), `${report.reservations.cancellationRate ?? "n/a"}%`);
  kv("Completed stays (check-out passed)", num(report.reservations.completed));
  kv("Average reservations / day", String(report.reservations.avgPerDay));
  drawSpark(report.reservations.series, "Reservations created");

  heading("Booking value and Isisel commission");
  text(report.notes.bookingValue, { size: 8, color: MUTED, gap: 8 });
  kv("Booking value managed through Isisel", money(report.economics.liveValue));
  kv("Confirmed booking value", money(report.economics.confirmedValue));
  kv("Cancelled booking value", money(report.economics.cancelledValue));
  kv("Gateway-confirmed value", money(report.economics.gatewayValue));
  kv("Isisel commission recorded", money(report.economics.revenue));
  kv("Commission waived (recorded)", money(report.economics.waived));
  kv("Commission-free reservations", num(report.economics.commissionFreeCount));
  kv("Average confirmed booking value", money(report.economics.avgBookingValue));
  drawSpark(report.economics.seriesRevenue, "Isisel commission recorded");

  heading("Founding 100");
  kv("Spots claimed", `${report.founding.claimed} / ${report.founding.limit}`);
  kv("Remaining", num(report.founding.remaining));
  kv("Active founding hosts", num(report.founding.active));
  kv("Expired / revoked", `${report.founding.expired} / ${report.founding.revoked}`);
  kv("Bookings by founding hosts", num(report.founding.bookingsGenerated));
  kv("Booking value generated", money(report.founding.bookingValue));
  kv("Commission waived (founding)", money(report.founding.commissionWaived));

  heading("Platform funnel (current stock)");
  kv("Registered users", num(report.funnel.users));
  kv("Verified hosts", num(report.funnel.hosts), `${report.funnel.conversions.userToHost ?? "n/a"}% of users`);
  kv("Hosts with properties", num(report.funnel.hostsWithProperties), `${report.funnel.conversions.hostToListed ?? "n/a"}% of hosts`);
  kv("Properties that received a reservation", num(report.funnel.propertiesWithReservations));
  kv("Live reservations (pending + confirmed)", num(report.funnel.reservations));

  heading("Notes on measurement");
  text(report.notes.activeUsers, { size: 8, color: MUTED, gap: 6 });
  text(report.notes.completedStays, { size: 8, color: MUTED, gap: 6 });
  text(report.notes.hostGrowth, { size: 8, color: MUTED, gap: 6 });
  text(report.notes.currencies, { size: 8, color: MUTED, gap: 6 });
  text(report.notes.userGeo, { size: 8, color: MUTED, gap: 6 });
  text(report.notes.trainingStays, { size: 8, color: MUTED, gap: 6 });

  ensure(24);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: LINE,
  });
  y -= 14;
  text("Confidential — Isisel operations. Figures are calculated from live MongoDB records.", {
    size: 8,
    color: MUTED,
  });

  return Buffer.from(await doc.save());
}
