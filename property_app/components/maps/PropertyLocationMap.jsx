"use client";

import { useMemo } from "react";
import GoogleMap from "@/components/maps/GoogleMap";
import { softEstimateCoordinates, coerceCoordinate } from "@/utils/address";
import { formatLocationLine } from "@/utils/listingPricing";
import { MapPin } from "lucide-react";

/**
 * Public property detail map. Always shows a centered pin when any address
 * exists — soft city/default estimate if lat/lng were never persisted.
 */
export default function PropertyLocationMap({ location = {} }) {
  const { lat, lng, estimated } = useMemo(() => {
    const coercedLat = coerceCoordinate(location.lat);
    const coercedLng = coerceCoordinate(location.lng);
    if (coercedLat != null && coercedLng != null) {
      return { lat: coercedLat, lng: coercedLng, estimated: false };
    }
    const soft = softEstimateCoordinates({
      street: location.street,
      city: location.city,
      state: location.state,
      zipcode: location.zipcode,
      country: location.country,
    });
    return { lat: soft.lat, lng: soft.lng, estimated: true };
  }, [location]);

  const addressLine = formatLocationLine(location);
  const { showExactLocation } = location;

  if (!addressLine && lat == null) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">Where you&apos;ll be</h2>
        {addressLine ? (
          <p className="mt-1 flex items-start gap-2 text-sm text-zinc-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {addressLine}
          </p>
        ) : null}
        {!showExactLocation ? (
          <p className="mt-2 text-xs text-zinc-500">
            Exact location is shared with guests after they book.
          </p>
        ) : null}
        {estimated ? (
          <p className="mt-2 text-xs text-amber-800/80">
            Approximate area shown — host pin coordinates were not saved with
            this listing.
          </p>
        ) : null}
      </div>
      <GoogleMap
        lat={lat}
        lng={lng}
        zoom={estimated ? 12 : 14}
        approximate={!showExactLocation || estimated}
        estimated={estimated}
        className="h-72 w-full sm:h-80"
      />
    </section>
  );
}
