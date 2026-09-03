/**
 * ISO 3166-1 alpha-2 countries where the site should default to French.
 *
 * Primary: French is an official language and typical UI language.
 * Bilingual: French is official alongside another language — use French
 * only when Accept-Language prefers it.
 */

export const PRIMARY_FRENCH_COUNTRIES = new Set([
  // West & Central Africa
  "SN", // Senegal
  "CI", // Côte d'Ivoire
  "ML", // Mali
  "BF", // Burkina Faso
  "NE", // Niger
  "GN", // Guinea
  "TG", // Togo
  "BJ", // Benin
  "TD", // Chad
  "CF", // Central African Republic
  "CG", // Congo-Brazzaville
  "CD", // DR Congo
  "GA", // Gabon
  "GQ", // Equatorial Guinea
  "BI", // Burundi
  "DJ", // Djibouti
  "KM", // Comoros
  "MG", // Madagascar
  "MR", // Mauritania (French widely used)
  "SC", // Seychelles
  // Maghreb — French is a common marketplace / travel language
  "MA",
  "TN",
  "DZ",
  // Haiti
  "HT",
  // France & territories
  "FR",
  "MC",
  "LU",
  "GF",
  "GP",
  "MQ",
  "RE",
  "YT",
  "NC",
  "PF",
  "WF",
  "BL",
  "MF",
  "PM",
  "TF",
  "VU",
]);

export const BILINGUAL_FRENCH_COUNTRIES = new Set([
  "BE", // Belgium
  "CH", // Switzerland
  "CA", // Canada
  "CM", // Cameroon
  "RW", // Rwanda
]);

/** IANA zones that imply a primary French-speaking country (no geo header). */
export const PRIMARY_FRENCH_TIMEZONES = new Set([
  "Africa/Abidjan",
  "Africa/Algiers",
  "Africa/Bamako",
  "Africa/Brazzaville",
  "Africa/Casablanca",
  "Africa/Conakry",
  "Africa/Dakar",
  "Africa/Djibouti",
  "Africa/Kinshasa",
  "Africa/Libreville",
  "Africa/Lome",
  "Africa/Malabo",
  "Africa/Ndjamena",
  "Africa/Niamey",
  "Africa/Nouakchott",
  "Africa/Ouagadougou",
  "Africa/Porto-Novo",
  "Africa/Tunis",
  "America/Port-au-Prince",
  "America/Martinique",
  "America/Guadeloupe",
  "America/Cayenne",
  "Europe/Paris",
  "Europe/Monaco",
  "Europe/Luxembourg",
  "Indian/Antananarivo",
  "Indian/Comoro",
  "Indian/Reunion",
  "Indian/Mayotte",
  "Pacific/Noumea",
  "Pacific/Tahiti",
]);

/** Bilingual regions — French only if the browser prefers it. */
export const BILINGUAL_FRENCH_TIMEZONES = new Set([
  "Africa/Kigali",
  "Africa/Douala",
  "America/Toronto",
  "America/Montreal",
  "Europe/Brussels",
  "Europe/Zurich",
]);
