import { PRIMARY_FRENCH_COUNTRIES } from "@/lib/i18n/frenchCountries";
import { DEFAULT_LANG } from "@/lib/legal/constants";

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.fr",
  "hotmail.com",
  "hotmail.fr",
  "outlook.com",
  "outlook.fr",
  "live.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "msn.com",
]);

const FRENCH_TLDS = new Set([
  "fr",
  "sn",
  "ml",
  "ci",
  "bf",
  "ne",
  "gn",
  "tg",
  "bj",
  "td",
  "ga",
  "mg",
  "ht",
  "lu",
  "mc",
  "re",
  "yt",
  "gf",
  "gp",
  "mq",
  "nc",
  "pf",
]);

const FRENCH_COUNTRY_NAMES = [
  "senegal",
  "sénégal",
  "mali",
  "mauritania",
  "mauritanie",
  "france",
  "ivory coast",
  "côte d'ivoire",
  "cote d'ivoire",
  "cote divoire",
  "burkina",
  "niger",
  "guinea",
  "guinée",
  "guinee",
  "togo",
  "benin",
  "bénin",
  "morocco",
  "maroc",
  "tunisia",
  "tunisie",
  "algeria",
  "algérie",
  "algerie",
  "madagascar",
  "haiti",
  "haïti",
  "gabon",
  "congo",
  "chad",
  "tchad",
  "luxembourg",
  "monaco",
  "réunion",
  "reunion",
  "martinique",
  "guadeloupe",
  "mayotte",
];

/**
 * @param {unknown} value
 * @returns {"en" | "fr" | null}
 */
export function parseUserLocale(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (text === "fr" || text.startsWith("fr-")) return "fr";
  if (text === "en" || text.startsWith("en-")) return "en";
  return null;
}

function localeFromCountry(user) {
  const code = String(user?.hostAddress?.countryCode || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
  if (PRIMARY_FRENCH_COUNTRIES.has(code)) return "fr";

  const name = String(user?.hostAddress?.country || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!name) return null;
  if (
    FRENCH_COUNTRY_NAMES.some((needle) =>
      name.includes(
        needle.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      ),
    )
  ) {
    return "fr";
  }
  return null;
}

function localeFromEmail(email) {
  const domain = String(email || "")
    .trim()
    .toLowerCase()
    .split("@")[1];
  if (!domain || GENERIC_EMAIL_DOMAINS.has(domain)) return null;
  const tld = domain.split(".").pop();
  if (FRENCH_TLDS.has(tld)) return "fr";
  return null;
}

/**
 * Language for a transactional / ops email to this account.
 * Saved site language wins; otherwise country, then a local email TLD.
 */
export function resolveUserEmailLocale(user) {
  return (
    parseUserLocale(user?.preferences?.language) ||
    localeFromCountry(user) ||
    localeFromEmail(user?.email) ||
    DEFAULT_LANG
  );
}
