/**
 * English / French country names + common aliases for catalog search.
 * Used so guests can find stays regardless of how the host typed the country.
 */

function entry(code, en, fr, extraAliases = []) {
  return { code, en, fr, aliases: extraAliases };
}

/** Focused on Africa + markets Isisel cares about. */
export const COUNTRY_ENTRIES = [
  entry("DZ", "Algeria", "Algérie", ["algerie", "dz"]),
  entry("AO", "Angola", "Angola", ["ao"]),
  entry("BJ", "Benin", "Bénin", ["benin", "bj"]),
  entry("BW", "Botswana", "Botswana", ["bw"]),
  entry("BF", "Burkina Faso", "Burkina Faso", ["burkina", "bf"]),
  entry("BI", "Burundi", "Burundi", ["bi"]),
  entry("CV", "Cabo Verde", "Cap-Vert", ["cape verde", "cap vert", "cv"]),
  entry("CM", "Cameroon", "Cameroun", ["cm"]),
  entry("CF", "Central African Republic", "République centrafricaine", [
    "centrafrique",
    "rca",
    "cf",
  ]),
  entry("TD", "Chad", "Tchad", ["td"]),
  entry("KM", "Comoros", "Comores", ["km"]),
  entry("CG", "Congo", "Congo", ["congo-brazzaville", "republic of the congo", "cg"]),
  entry("CD", "DR Congo", "RD Congo", [
    "democratic republic of the congo",
    "drc",
    "rdc",
    "zaire",
    "congo-kinshasa",
    "cd",
  ]),
  entry("CI", "Côte d'Ivoire", "Côte d'Ivoire", [
    "ivory coast",
    "cote d'ivoire",
    "cote divoire",
    "côte divoire",
    "ci",
  ]),
  entry("DJ", "Djibouti", "Djibouti", ["dj"]),
  entry("EG", "Egypt", "Égypte", ["egypte", "eg"]),
  entry("GQ", "Equatorial Guinea", "Guinée équatoriale", [
    "guinee equatoriale",
    "gq",
  ]),
  entry("ER", "Eritrea", "Érythrée", ["erythree", "er"]),
  entry("SZ", "Eswatini", "Eswatini", ["swaziland", "sz"]),
  entry("ET", "Ethiopia", "Éthiopie", ["ethiopie", "et"]),
  entry("GA", "Gabon", "Gabon", ["ga"]),
  entry("GM", "Gambia", "Gambie", ["gm"]),
  entry("GH", "Ghana", "Ghana", ["gh"]),
  entry("GN", "Guinea", "Guinée", ["guinee", "gn"]),
  entry("GW", "Guinea-Bissau", "Guinée-Bissau", ["guinee-bissau", "gw"]),
  entry("KE", "Kenya", "Kenya", ["ke"]),
  entry("LS", "Lesotho", "Lesotho", ["ls"]),
  entry("LR", "Liberia", "Libéria", ["liberia", "lr"]),
  entry("LY", "Libya", "Libye", ["ly"]),
  entry("MG", "Madagascar", "Madagascar", ["mg"]),
  entry("MW", "Malawi", "Malawi", ["mw"]),
  entry("ML", "Mali", "Mali", ["ml"]),
  entry("MR", "Mauritania", "Mauritanie", ["mr"]),
  entry("MU", "Mauritius", "Maurice", ["mu"]),
  entry("MA", "Morocco", "Maroc", ["ma"]),
  entry("MZ", "Mozambique", "Mozambique", ["mz"]),
  entry("NA", "Namibia", "Namibie", ["na"]),
  entry("NE", "Niger", "Niger", ["ne"]),
  entry("NG", "Nigeria", "Nigéria", ["nigeria", "ng"]),
  entry("RW", "Rwanda", "Rwanda", ["rw"]),
  entry("ST", "Sao Tome and Principe", "Sao Tomé-et-Principe", [
    "sao tome",
    "são tomé",
    "st",
  ]),
  entry("SN", "Senegal", "Sénégal", ["senegal", "sn"]),
  entry("SC", "Seychelles", "Seychelles", ["sc"]),
  entry("SL", "Sierra Leone", "Sierra Leone", ["sl"]),
  entry("SO", "Somalia", "Somalie", ["so"]),
  entry("ZA", "South Africa", "Afrique du Sud", ["rsa", "za"]),
  entry("SS", "South Sudan", "Soudan du Sud", ["ss"]),
  entry("SD", "Sudan", "Soudan", ["sd"]),
  entry("TZ", "Tanzania", "Tanzanie", ["tz", "united republic of tanzania"]),
  entry("TG", "Togo", "Togo", ["tg"]),
  entry("TN", "Tunisia", "Tunisie", ["tn"]),
  entry("UG", "Uganda", "Ouganda", ["ug"]),
  entry("ZM", "Zambia", "Zambie", ["zm"]),
  entry("ZW", "Zimbabwe", "Zimbabwe", ["zw"]),
  entry("FR", "France", "France", ["fr"]),
  entry("RE", "Réunion", "La Réunion", ["reunion", "re"]),
  entry("YT", "Mayotte", "Mayotte", ["yt"]),
];

/** Lowercase, strip accents/punctuation for fuzzy country matching. */
export function normalizeCountryText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[''`´]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function allNamesForCountry(country) {
  return [country.en, country.fr, country.code, ...(country.aliases || [])].filter(
    Boolean,
  );
}

/** Countries whose EN/FR/alias names match the typed query. */
export function matchCountriesForQuery(query) {
  const needle = normalizeCountryText(query);
  if (!needle || needle.length < 2) return [];

  return COUNTRY_ENTRIES.filter((country) =>
    allNamesForCountry(country).some((name) => {
      const n = normalizeCountryText(name);
      if (!n) return false;
      return n.startsWith(needle) || needle.startsWith(n) || n.includes(needle);
    }),
  );
}

/**
 * Expand a free-text location query into searchable terms
 * (raw query + EN/FR country aliases when applicable).
 *
 * Keeps accented and unaccented spellings as separate terms so Mongo
 * case-insensitive regex can still match host-entered diacritics.
 */
export function expandLocationSearchTerms(query) {
  const raw = String(query || "").trim();
  if (!raw) return [];

  const terms = [];
  const seen = new Set();
  const add = (term) => {
    const t = String(term || "").trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    terms.push(t);
  };

  add(raw);
  for (const country of matchCountriesForQuery(raw)) {
    for (const name of allNamesForCountry(country)) add(name);
  }

  return terms;
}

/** Localized display label for a matched country. */
export function countryDisplayName(country, lang = "en") {
  if (!country) return "";
  return lang === "fr" ? country.fr : country.en;
}

/** Resolve a stored country string to a known entry (best effort). */
export function resolveCountryEntry(stored) {
  const needle = normalizeCountryText(stored);
  if (!needle) return null;
  return (
    COUNTRY_ENTRIES.find((country) =>
      allNamesForCountry(country).some(
        (name) => normalizeCountryText(name) === needle,
      ),
    ) || null
  );
}
