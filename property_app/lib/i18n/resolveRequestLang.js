import {
  BILINGUAL_FRENCH_COUNTRIES,
  BILINGUAL_FRENCH_TIMEZONES,
  PRIMARY_FRENCH_COUNTRIES,
  PRIMARY_FRENCH_TIMEZONES,
} from "./frenchCountries";

/**
 * @param {string | null | undefined} header
 * @returns {boolean}
 */
export function acceptLanguagePrefersFrench(header) {
  if (!header || typeof header !== "string") return false;
  const parts = header.split(",").map((raw) => {
    const [tagPart, ...params] = raw.trim().split(";");
    const tag = (tagPart || "").trim().toLowerCase();
    const qParam = params.find((p) => p.trim().startsWith("q="));
    const q = qParam ? Number(qParam.trim().slice(2)) : 1;
    return { tag, q: Number.isFinite(q) ? q : 1 };
  });

  let frQ = 0;
  let enQ = 0;
  for (const part of parts) {
    if (part.tag === "fr" || part.tag.startsWith("fr-")) {
      frQ = Math.max(frQ, part.q);
    }
    if (part.tag === "en" || part.tag.startsWith("en-")) {
      enQ = Math.max(enQ, part.q);
    }
  }
  if (frQ === 0) return false;
  return frQ >= enQ;
}

/**
 * @param {string | null | undefined} value
 * @returns {"en" | "fr" | null}
 */
export function parseLang(value) {
  if (value === "fr" || value === "en") return value;
  return null;
}

/**
 * Geo + cookie language for guests. User choice always wins.
 *
 * @param {{
 *   cookieLang?: string | null,
 *   explicitChoice?: boolean,
 *   queryLang?: string | null,
 *   country?: string | null,
 *   acceptLanguage?: string | null,
 *   timeZone?: string | null,
 * }} input
 * @returns {{ lang: "en" | "fr", source: "query" | "choice" | "geo" | "timezone" | "bilingual" | "accept-language" | "default" }}
 */
export function resolveRequestLang({
  cookieLang,
  explicitChoice,
  queryLang,
  country,
  acceptLanguage,
  timeZone,
} = {}) {
  const fromQuery = parseLang(queryLang);
  if (fromQuery) {
    return { lang: fromQuery, source: "query" };
  }

  const fromCookie = parseLang(cookieLang);
  if (explicitChoice && fromCookie) {
    return { lang: fromCookie, source: "choice" };
  }

  const iso = String(country || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
  const zone = String(timeZone || "").trim();
  const prefersFr = acceptLanguagePrefersFrench(acceptLanguage);

  if (PRIMARY_FRENCH_COUNTRIES.has(iso)) {
    return { lang: "fr", source: "geo" };
  }
  if (PRIMARY_FRENCH_TIMEZONES.has(zone)) {
    return { lang: "fr", source: "timezone" };
  }
  if (BILINGUAL_FRENCH_COUNTRIES.has(iso) && prefersFr) {
    return { lang: "fr", source: "bilingual" };
  }
  if (BILINGUAL_FRENCH_TIMEZONES.has(zone) && prefersFr) {
    return { lang: "fr", source: "bilingual" };
  }
  if (prefersFr) {
    return { lang: "fr", source: "accept-language" };
  }

  return { lang: "en", source: "default" };
}
