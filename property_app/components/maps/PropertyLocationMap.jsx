"use client";

import GoogleMap from "@/components/maps/GoogleMap";
import { formatLocationLine } from "@/utils/listingPricing";
import { MapPin } from "lucide-react";

export default function PropertyLocationMap({ location = {} }) {
  const { lat, lng, showExactLocation } = location;
  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng);

  if (!hasCoords) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">Where you&apos;ll be</h2>
        <p className="mt-1 flex items-start gap-2 text-sm text-zinc-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {formatLocationLine(location)}
        </p>
        {!showExactLocation ? (
          <p className="mt-2 text-xs text-zinc-500">
            Exact location is shared with guests after they book.
          </p>
        ) : null}
      </div>
      <GoogleMap
        lat={lat}
        lng={lng}
        zoom={14}
        approximate={!showExactLocation}
        className="h-72 w-full sm:h-80"
      />
    </section>
  );
}
