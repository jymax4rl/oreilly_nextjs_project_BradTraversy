/**
 * Coarse guest location for the ops live map.
 *
 * Never stores IP. Production uses Vercel edge geo headers. Localhost has
 * none of those, so the probe may send an IANA timezone as a city-level fallback.
 * Coordinates are rounded and jittered so stacked city sessions do not sit on
 * one pixel and so we do not keep street-level precision.
 */

const TZ_RE = /^[A-Za-z0-9_+\-/]{1,64}$/;

/** IANA zone → [lat, lng, ISO country]. City centroids, not GPS. */
const TZ_COORDS = {
  "Africa/Abidjan": [5.36, -4.01, "CI"],
  "Africa/Accra": [5.56, -0.2, "GH"],
  "Africa/Addis_Ababa": [9.03, 38.74, "ET"],
  "Africa/Algiers": [36.75, 3.06, "DZ"],
  "Africa/Cairo": [30.04, 31.24, "EG"],
  "Africa/Casablanca": [33.57, -7.59, "MA"],
  "Africa/Dakar": [14.69, -17.45, "SN"],
  "Africa/Dar_es_Salaam": [-6.79, 39.21, "TZ"],
  "Africa/Djibouti": [11.59, 43.15, "DJ"],
  "Africa/Freetown": [8.48, -13.23, "SL"],
  "Africa/Gaborone": [-24.65, 25.91, "BW"],
  "Africa/Harare": [-17.83, 31.05, "ZW"],
  "Africa/Johannesburg": [-26.2, 28.05, "ZA"],
  "Africa/Juba": [4.86, 31.57, "SS"],
  "Africa/Kampala": [0.35, 32.58, "UG"],
  "Africa/Khartoum": [15.5, 32.56, "SD"],
  "Africa/Kigali": [-1.94, 30.06, "RW"],
  "Africa/Kinshasa": [-4.33, 15.31, "CD"],
  "Africa/Lagos": [6.52, 3.38, "NG"],
  "Africa/Libreville": [0.39, 9.45, "GA"],
  "Africa/Luanda": [-8.84, 13.23, "AO"],
  "Africa/Lusaka": [-15.42, 28.28, "ZM"],
  "Africa/Maputo": [-25.97, 32.57, "MZ"],
  "Africa/Mogadishu": [2.05, 45.32, "SO"],
  "Africa/Nairobi": [-1.29, 36.82, "KE"],
  "Africa/Ndjamena": [12.13, 15.05, "TD"],
  "Africa/Niamey": [13.51, 2.11, "NE"],
  "Africa/Nouakchott": [18.07, -15.98, "MR"],
  "Africa/Ouagadougou": [12.37, -1.53, "BF"],
  "Africa/Porto-Novo": [6.5, 2.6, "BJ"],
  "Africa/Tripoli": [32.89, 13.19, "LY"],
  "Africa/Tunis": [36.81, 10.18, "TN"],
  "Africa/Windhoek": [-22.56, 17.08, "NA"],
  "America/Chicago": [41.88, -87.63, "US"],
  "America/Denver": [39.74, -104.99, "US"],
  "America/Los_Angeles": [34.05, -118.24, "US"],
  "America/New_York": [40.71, -74.01, "US"],
  "America/Sao_Paulo": [-23.55, -46.63, "BR"],
  "America/Toronto": [43.65, -79.38, "CA"],
  "Asia/Dubai": [25.2, 55.27, "AE"],
  "Asia/Hong_Kong": [22.32, 114.17, "HK"],
  "Asia/Kolkata": [19.08, 72.88, "IN"],
  "Asia/Shanghai": [31.23, 121.47, "CN"],
  "Asia/Singapore": [1.35, 103.82, "SG"],
  "Asia/Tokyo": [35.68, 139.69, "JP"],
  "Australia/Sydney": [-33.87, 151.21, "AU"],
  "Europe/Amsterdam": [52.37, 4.89, "NL"],
  "Europe/Andorra": [42.51, 1.52, "AD"],
  "Europe/Athens": [37.98, 23.73, "GR"],
  "Europe/Belgrade": [44.82, 20.47, "RS"],
  "Europe/Berlin": [52.52, 13.4, "DE"],
  "Europe/Bratislava": [48.15, 17.11, "SK"],
  "Europe/Brussels": [50.85, 4.35, "BE"],
  "Europe/Bucharest": [44.43, 26.1, "RO"],
  "Europe/Budapest": [47.5, 19.04, "HU"],
  "Europe/Copenhagen": [55.68, 12.57, "DK"],
  "Europe/Dublin": [53.35, -6.26, "IE"],
  "Europe/Gibraltar": [36.14, -5.35, "GI"],
  "Europe/Helsinki": [60.17, 24.94, "FI"],
  "Europe/Istanbul": [41.01, 28.98, "TR"],
  "Europe/Kyiv": [50.45, 30.52, "UA"],
  "Europe/Kiev": [50.45, 30.52, "UA"],
  "Europe/Lisbon": [38.72, -9.14, "PT"],
  "Europe/Ljubljana": [46.05, 14.51, "SI"],
  "Europe/London": [51.51, -0.13, "GB"],
  "Europe/Luxembourg": [49.61, 6.13, "LU"],
  "Europe/Madrid": [40.42, -3.7, "ES"],
  "Europe/Malta": [35.9, 14.51, "MT"],
  "Europe/Monaco": [43.74, 7.43, "MC"],
  "Europe/Moscow": [55.76, 37.62, "RU"],
  "Europe/Oslo": [59.91, 10.75, "NO"],
  "Europe/Paris": [48.86, 2.35, "FR"],
  "Europe/Prague": [50.08, 14.44, "CZ"],
  "Europe/Rome": [41.9, 12.5, "IT"],
  "Europe/Sofia": [42.7, 23.32, "BG"],
  "Europe/Stockholm": [59.33, 18.07, "SE"],
  "Europe/Vienna": [48.21, 16.37, "AT"],
  "Europe/Warsaw": [52.23, 21.01, "PL"],
  "Europe/Zagreb": [45.81, 15.98, "HR"],
  "Europe/Zurich": [47.38, 8.54, "CH"],
};

function roundCoord(n) {
  return Math.round(Number(n) * 100) / 100;
}

function parseHeaderCoord(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function sanitizeTimeZone(tz) {
  if (typeof tz !== "string") return null;
  const trimmed = tz.trim();
  if (!TZ_RE.test(trimmed)) return null;
  return trimmed;
}

function cityLabelFromZone(tz) {
  const key = sanitizeTimeZone(tz);
  if (!key || !key.includes("/")) return "";
  return key.split("/").pop().replace(/_/g, " ");
}

function fromTimeZone(tz) {
  const key = sanitizeTimeZone(tz);
  if (!key) return null;
  const hit = TZ_COORDS[key];
  if (hit) {
    return {
      lat: hit[0],
      lng: hit[1],
      country: hit[2],
      city: cityLabelFromZone(key),
    };
  }
  return null;
}

/**
 * Stable ~40km scatter from the anonymous session id so many guests in one
 * city do not hide under a single dot. Same sid always lands in the same place.
 */
export function jitterFromSid(sid, lat, lng) {
  let h = 2166136261;
  const s = String(sid || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = (h >>> 0) / 4294967295;
  const v = ((h >>> 8) >>> 0) / 4294967295;
  const dLat = (u - 0.5) * 0.7;
  const dLng = (v - 0.5) * 0.7;
  const nextLat = Math.max(-85, Math.min(85, lat + dLat));
  let nextLng = lng + dLng;
  if (nextLng > 180) nextLng -= 360;
  if (nextLng < -180) nextLng += 360;
  return { lat: roundCoord(nextLat), lng: roundCoord(nextLng) };
}

/**
 * Prefer Vercel edge coordinates (production). Fall back to timezone centroid
 * on localhost, where those headers are absent.
 *
 * @returns {{ lat: number, lng: number, country: string, city: string, source: "vercel" | "tz" } | null}
 */
export function geoFromRequest(request, tz) {
  const headers = request?.headers;
  const headerTz = sanitizeTimeZone(headers?.get("x-vercel-ip-timezone"));
  const bodyTz = sanitizeTimeZone(tz);

  if (headers) {
    const vercelLat = parseHeaderCoord(headers.get("x-vercel-ip-latitude"));
    const vercelLng = parseHeaderCoord(headers.get("x-vercel-ip-longitude"));
    const country = String(headers.get("x-vercel-ip-country") || "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 2);
    let city = "";
    try {
      city = decodeURIComponent(headers.get("x-vercel-ip-city") || "")
        .replace(/[<>]/g, "")
        .slice(0, 80);
    } catch {
      city = "";
    }

    if (
      vercelLat != null &&
      vercelLng != null &&
      Math.abs(vercelLat) <= 90 &&
      Math.abs(vercelLng) <= 180
    ) {
      return {
        lat: roundCoord(vercelLat),
        lng: roundCoord(vercelLng),
        country,
        city,
        source: "vercel",
      };
    }
  }

  const tzGeo = fromTimeZone(bodyTz || headerTz);
  if (!tzGeo) return null;
  return { ...tzGeo, source: "tz" };
}
