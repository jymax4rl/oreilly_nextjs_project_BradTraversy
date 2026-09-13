/**
 * Isisel luxury editorial Google Maps JSON style (raster Styled Maps).
 *
 * Tuned to exact Isisel platform tokens (Expo/web brand) — cream water,
 * teal-ink land, quiet labels — not a generic charcoal dark map.
 * Pass as `styles` on `google.maps.Map` — do NOT set `mapId` (OverlayView pins
 * require classic raster tiles). Teal pins stay `#1B5C57` in map components.
 */

/** Platform cream / surfaces — water fill */
const CREAM = "#F4F1EC";
/** Soft brand wash — water label stroke */
const BRAND_SOFT = "#E8F1EF";
/** Charcoal ink — primary land base */
const INK = "#1C2423";
/** Brand deep teal — natural / terrain tint so land reads teal-ink */
const BRAND_DEEP = "#134843";
/** Mid teal-ink for gentle landscape variation */
const LAND_TEAL = "#1B4541";
/** Quiet roads — slightly lighter than land, never bright */
const ROAD = "#2A3532";
const ROAD_SOFT = "#3A4A46";
/** Thin admin borders */
const ADMIN_STROKE = "#3A4A46";
/** Soft cream labels on dark teal-ink land */
const LABEL_ON_LAND = "#E8F1EF";
const LABEL_STROKE_LAND = "#1C2423";
/** brandMuted labels over cream water */
const LABEL_ON_WATER = "#89A8A2";
const LABEL_STROKE_WATER = BRAND_SOFT;

/** @type {google.maps.MapTypeStyle[]} */
export const ISEL_MAP_STYLES = [
  // Global geometry → teal-ink land base (not flat grey)
  {
    elementType: "geometry",
    stylers: [{ color: INK }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: LABEL_ON_LAND }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: LABEL_STROKE_LAND }, { weight: 3 }],
  },

  // Administrative — thin, quiet borders only
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: ADMIN_STROKE }, { weight: 0.55 }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: ADMIN_STROKE }, { weight: 0.45 }],
  },

  // Landscape — ink base with brand-deep / teal-ink natural variation
  {
    featureType: "landscape",
    elementType: "geometry.fill",
    stylers: [{ color: INK }],
  },
  {
    featureType: "landscape.man_made",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry.fill",
    stylers: [{ color: LAND_TEAL }],
  },
  {
    featureType: "landscape.natural.terrain",
    elementType: "geometry.fill",
    stylers: [{ color: BRAND_DEEP }],
  },

  // POI / transit — fully off (editorial, uncluttered)
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },

  // Roads — very quiet, slightly lighter than land
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: ROAD }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: ROAD_SOFT }, { visibility: "simplified" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: ROAD_SOFT }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: ROAD }, { visibility: "simplified" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: ROAD }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.fill",
    stylers: [{ color: ROAD }],
  },

  // Water — warm platform cream (editorial coastline)
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: CREAM }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: CREAM }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: LABEL_ON_WATER }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: LABEL_STROKE_WATER }, { weight: 2 }],
  },
];
