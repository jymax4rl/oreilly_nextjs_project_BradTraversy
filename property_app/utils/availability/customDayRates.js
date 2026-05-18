import { isValidDateOnly, parseDateOnly } from "@/utils/availability/dateUtils";
import { parseRate } from "@/utils/propertyRates";

const MAX_OVERRIDES = 366;

/** @returns {Array<{ date: string, priceUsd: number, note?: string }>} */
export function normalizeCustomDayRates(customDayRates) {
  if (!Array.isArray(customDayRates)) return [];

  const byDate = new Map();
  for (const item of customDayRates) {
    const date = item?.date;
    const priceUsd = parseRate(item?.priceUsd ?? item?.price);
    if (!isValidDateOnly(date) || priceUsd == null) continue;

    byDate.set(date, {
      date,
      priceUsd,
      note:
        typeof item?.note === "string"
          ? item.note.trim().slice(0, 200)
          : undefined,
    });
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function validateCustomDayRates(customDayRates) {
  const errors = [];

  if (!Array.isArray(customDayRates)) {
    return { errors: ["customDayRates must be an array"], normalized: [] };
  }

  if (customDayRates.length > MAX_OVERRIDES) {
    errors.push(`At most ${MAX_OVERRIDES} custom day rates allowed`);
  }

  const normalized = normalizeCustomDayRates(customDayRates);

  if (normalized.length !== customDayRates.length && customDayRates.length > 0) {
    const invalidCount = customDayRates.length - normalized.length;
    if (invalidCount > 0) {
      errors.push(`${invalidCount} custom rate entr${invalidCount === 1 ? "y" : "ies"} had invalid date or price`);
    }
  }

  return { errors, normalized };
}

/** @returns {Map<string, number>} */
export function customDayRatesToMap(customDayRates) {
  const map = new Map();
  for (const row of normalizeCustomDayRates(customDayRates)) {
    map.set(row.date, row.priceUsd);
  }
  return map;
}

export function getCustomRateForDate(customDayRates, dateStr) {
  return customDayRatesToMap(customDayRates).get(dateStr) ?? null;
}

export function upsertCustomDayRate(customDayRates, date, priceUsd) {
  const price = parseRate(priceUsd);
  if (!isValidDateOnly(date) || price == null) {
    return normalizeCustomDayRates(customDayRates);
  }
  const list = normalizeCustomDayRates(customDayRates).filter((r) => r.date !== date);
  list.push({ date, priceUsd: price });
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

export function removeCustomDayRate(customDayRates, date) {
  return normalizeCustomDayRates(customDayRates).filter((r) => r.date !== date);
}
