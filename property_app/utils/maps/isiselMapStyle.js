/**
 * Isisel luxury editorial Google Maps JSON style (raster Styled Maps).
 *
 * Cream / parchment water, charcoal land, quiet labels, no POI/transit clutter.
 * Pass as `styles` on `google.maps.Map` — do NOT set `mapId` (OverlayView pins
 * require classic raster tiles).
 *
 * Colors tuned for mobile contrast on narrow viewports while matching the
 * editorial basemap mock as closely as Google styled maps allow.
 */

const WATER = "#E8E4DC";
const LAND = "#2C3533";
const LAND_SOFT = "#343D3A";
const ROAD = "#3A4441";
const ADMIN_STROKE = "#4A5553";
/** Light labels on dark land */
const LABEL_ON_LAND = "#D2D8D5";
const LABEL_STROKE_LAND = "#2C3533";
/** Muted teal-grey labels over cream water */
const LABEL_ON_WATER = "#6E8580";
const LABEL_STROKE_WATER = "#E8E4DC";

/** @type {google.maps.MapTypeStyle[]} */
export const ISEL_MAP_STYLES = [
  // Global geometry → charcoal land base
  {
    elementType: "geometry",
    stylers: [{ color: LAND }],
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
    stylers: [{ color: ADMIN_STROKE }, { weight: 0.6 }],
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
    stylers: [{ color: ADMIN_STROKE }, { weight: 0.5 }],
  },

  // Landscape
  {
    featureType: "landscape",
    elementType: "geometry.fill",
    stylers: [{ color: LAND }],
  },
  {
    featureType: "landscape.man_made",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry.fill",
    stylers: [{ color: LAND }],
  },
  {
    featureType: "landscape.natural.terrain",
    elementType: "geometry.fill",
    stylers: [{ color: LAND_SOFT }],
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

  // Roads — nearly invisible, slightly lighter than land
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: ROAD }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: LAND_SOFT }, { visibility: "simplified" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: ROAD }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: LAND_SOFT }, { visibility: "simplified" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: LAND_SOFT }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.fill",
    stylers: [{ color: LAND_SOFT }],
  },

  // Water — warm cream / parchment coastal feel
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: WATER }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: WATER }],
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
