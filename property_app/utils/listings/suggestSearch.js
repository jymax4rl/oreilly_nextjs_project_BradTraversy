import Property from "@/models/Property";
import { withApprovedListingFilter } from "@/utils/listingApproval";
import {
  countryDisplayName,
  expandLocationSearchTerms,
  normalizeCountryText,
  resolveCountryEntry,
} from "@/lib/i18n/countryAliases";

export function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Mongo `$or` clauses for free-text location/name search,
 * expanding EN/FR country aliases so "Maroc" finds "Morocco" listings.
 */
export function buildLocationOrClauses(locationQuery) {
  const terms = expandLocationSearchTerms(locationQuery);
  if (!terms.length) return null;

  const or = [];
  for (const term of terms) {
    const regex = new RegExp(escapeRegex(term), "i");
    or.push(
      { "location.city": regex },
      { "location.state": regex },
      { "location.country": regex },
      { "location.street": regex },
      { "location.zipcode": regex },
      { name: regex },
    );
  }
  return or;
}

function countryMatchesQuery(countryRaw, countryEntry, needle) {
  const names = countryEntry
    ? [countryEntry.en, countryEntry.fr, countryEntry.code, ...(countryEntry.aliases || [])]
    : [countryRaw];
  return names.some((n) => {
    const nn = normalizeCountryText(n);
    if (!nn) return false;
    return nn.startsWith(needle) || needle.startsWith(nn) || nn.includes(needle);
  });
}

/**
 * DB-backed search suggestions. Only returns places/names that exist
 * on publicly browsable listings — no empty propositions.
 *
 * @param {string} q
 * @param {{ limit?: number, lang?: string }} [opts]
 */
export async function suggestCatalogSearch(q, opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 8, 1), 12);
  const lang = opts.lang === "fr" ? "fr" : "en";
  const query = String(q || "").trim();

  if (query.length < 2) {
    return { ok: true, suggestions: [] };
  }

  const locationOr = buildLocationOrClauses(query);
  if (!locationOr?.length) {
    return { ok: true, suggestions: [] };
  }

  const findQuery = {
    $and: [withApprovedListingFilter({}), { $or: locationOr }],
  };

  const docs = await Property.find(findQuery)
    .select("name location.city location.state location.country")
    .limit(150)
    .lean();

  if (!docs.length) {
    return { ok: true, suggestions: [] };
  }

  const needle = normalizeCountryText(query);
  const cityMap = new Map();
  const countryMap = new Map();
  const propertyHits = [];

  for (const doc of docs) {
    const city = String(doc.location?.city || "").trim();
    const state = String(doc.location?.state || "").trim();
    const countryRaw = String(doc.location?.country || "").trim();
    const name = String(doc.name || "").trim();
    const countryEntry = resolveCountryEntry(countryRaw);
    const countryKey = countryEntry
      ? countryEntry.code
      : normalizeCountryText(countryRaw) || countryRaw.toLowerCase();
    const countryLabel = countryEntry
      ? countryDisplayName(countryEntry, lang)
      : countryRaw;

    if (city) {
      const cityNorm = normalizeCountryText(city);
      if (
        cityNorm &&
        (cityNorm.includes(needle) || needle.includes(cityNorm))
      ) {
        const key = `${cityNorm}|${countryKey}`;
        const prev = cityMap.get(key);
        if (prev) prev.count += 1;
        else {
          cityMap.set(key, {
            type: "city",
            label: city,
            subtitle: countryLabel || state || null,
            value: countryLabel ? `${city}, ${countryLabel}` : city,
            count: 1,
          });
        }
      }
    }

    if ((countryRaw || countryEntry) && countryMatchesQuery(countryRaw, countryEntry, needle)) {
      const prev = countryMap.get(countryKey);
      if (prev) prev.count += 1;
      else {
        countryMap.set(countryKey, {
          type: "country",
          label: countryLabel || countryRaw,
          subtitle: null,
          value: countryLabel || countryRaw,
          count: 1,
        });
      }
    }

    if (name) {
      const nameNorm = normalizeCountryText(name);
      if (nameNorm.includes(needle)) {
        propertyHits.push({
          type: "property",
          label: name,
          subtitle:
            [city, countryLabel || countryRaw].filter(Boolean).join(", ") ||
            null,
          value: name,
          count: 1,
          id: String(doc._id),
        });
      }
    }
  }

  const suggestions = [
    ...[...countryMap.values()].sort((a, b) => b.count - a.count),
    ...[...cityMap.values()].sort((a, b) => b.count - a.count),
    ...propertyHits.sort((a, b) => a.label.localeCompare(b.label)),
  ]
    .filter((s) => s.count > 0 && s.label)
    .slice(0, limit)
    .map(({ id, ...rest }) => (id ? { ...rest, id } : rest));

  return { ok: true, suggestions };
}

// Re-export for catalog query convenience
export { expandLocationSearchTerms };
