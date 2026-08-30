"use client";
import React from "react";
import RightColumn from "./RightColumn";
import PropertyImageGallery from "@/components/PropertyImageGallery";
import PropertyDetails from "./PropertyDetails";
import PropertyLocationMap from "@/components/maps/PropertyLocationMap";
import { formatLocationLine } from "@/utils/listingPricing";
import { MapPin, Star } from "lucide-react";

export default function DynamicProperty({ property }) {
  const data = property;

  return (
    <div className="min-h-screen bg-[var(--kama-canvas)] pb-[calc(var(--kama-chrome-clearance,4.25rem)+5.5rem)] pt-14 font-sans text-[var(--kama-ink)] selection:bg-[var(--kama-accent-soft)] sm:pt-16 md:pt-20 lg:pb-20">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:space-y-8 sm:px-6 sm:py-6">
        <div className="min-w-0 overflow-x-clip">
          <PropertyImageGallery
            images={data.images}
            propertyName={data.name}
            audio={data.audio}
          />
        </div>

        <header className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[var(--kama-accent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              {data.type}
            </span>
            {data.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--kama-ink)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                <Star size={10} fill="currentColor" aria-hidden />
                Featured
              </span>
            )}
          </div>
          <h1 className="text-[1.65rem] font-semibold leading-snug tracking-tight text-[var(--kama-ink)] sm:text-3xl md:text-4xl">
            {data.name}
          </h1>
          <div className="flex items-start gap-2 text-sm text-[var(--kama-ink-muted)]">
            <MapPin
              size={16}
              className="mt-0.5 shrink-0 fill-none stroke-current text-[var(--kama-accent)]"
              aria-hidden
            />
            <span className="min-w-0 break-words">
              {formatLocationLine(data.location)}
            </span>
          </div>
        </header>

        <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="order-1 min-w-0 lg:order-2 lg:col-span-1">
            <RightColumn data={data} />
          </div>
          <div className="order-2 min-w-0 space-y-8 lg:order-1 lg:col-span-2">
            <PropertyLocationMap location={data.location} />
            <PropertyDetails data={data} />
          </div>
        </div>
      </main>
    </div>
  );
}
