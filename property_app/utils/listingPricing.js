/** Nightly rate used for search filters (USD base). */
export function computeListingPrice(rates = {}) {
  const nightly = Number(rates.nightly);
  if (Number.isFinite(nightly) && nightly > 0) return nightly;

  const weekly = Number(rates.weekly);
  if (Number.isFinite(weekly) && weekly > 0) return Math.round(weekly / 7);

  const monthly = Number(rates.monthly);
  if (Number.isFinite(monthly) && monthly > 0) return Math.round(monthly / 30);

  return null;
}

export function computeWeekendNightly(baseNightly, weekendPremiumPercent = 0) {
  const base = Number(baseNightly);
  const premium = Number(weekendPremiumPercent);
  if (!Number.isFinite(base) || base <= 0) return null;
  if (!Number.isFinite(premium) || premium <= 0) return base;
  return Math.round(base * (1 + premium / 100));
}

export function formatLocationLine(location = {}) {
  if (location.formatted?.trim()) return location.formatted.trim();
  return [location.street, location.city, location.country]
    .filter(Boolean)
    .join(", ");
}
