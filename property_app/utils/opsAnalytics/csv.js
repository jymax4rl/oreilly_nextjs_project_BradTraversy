function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function seriesCsv(title, series, valueKey = "value") {
  const lines = [`bucket,${title}`];
  for (const row of series || []) {
    const value = row[valueKey] ?? row.value;
    lines.push([csvEscape(row.t), csvEscape(value)].join(","));
  }
  return lines.join("\n");
}

export function buildAnalyticsCsv(kind, report) {
  switch (kind) {
    case "users":
      return seriesCsv("new_users", report.users.series, "added");
    case "hosts":
      return seriesCsv("new_hosts", report.hosts.series);
    case "properties":
      return seriesCsv("new_properties", report.properties.series, "added");
    case "reservations":
      return seriesCsv("reservations", report.reservations.series);
    case "revenue":
      return seriesCsv("isisel_commission", report.economics.seriesRevenue);
    case "booking-value":
      return seriesCsv("booking_value_managed", report.economics.seriesValue);
    case "kpis": {
      const headers = ["metric", "current", "previous", "delta_pct"];
      const rows = Object.entries(report.kpis).map(([key, kpi]) =>
        [key, kpi.current, kpi.previous ?? "", kpi.deltaPct ?? ""].map(csvEscape).join(","),
      );
      return [headers.join(","), ...rows].join("\n");
    }
    default:
      return "";
  }
}

export const CSV_KINDS = [
  "kpis",
  "users",
  "hosts",
  "properties",
  "reservations",
  "booking-value",
  "revenue",
];
