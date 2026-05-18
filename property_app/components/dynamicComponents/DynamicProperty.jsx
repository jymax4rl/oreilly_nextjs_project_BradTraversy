"use client";
import React from "react";
import RightColumn from "./RightColumn";
import PropertyImageGallery from "@/components/PropertyImageGallery";
import PropertyDetails from "./PropertyDetails";
import { MapPin, Star } from "lucide-react";

export default function DynamicProperty({ property }) {
  const data = property;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-24 pt-14 font-sans text-slate-900 selection:bg-blue-100 sm:pb-20 md:pt-20">
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-3 sm:space-y-8 sm:px-6 sm:py-6">
        <PropertyImageGallery images={data.images} propertyName={data.name} />

        <header className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-blue-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {data.type}
            </span>
            {data.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <Star size={10} fill="currentColor" aria-hidden />
                Featured
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            {data.name}
          </h1>
          <div className="flex items-start gap-2 text-sm text-slate-500">
            <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">
              {data.location.street}, {data.location.city},{" "}
              {data.location.country}
            </span>
          </div>
        </header>

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-12">
          <div className="order-1 min-w-0 lg:order-2 lg:col-span-1">
            <RightColumn data={data} />
          </div>
          <div className="order-2 min-w-0 lg:order-1 lg:col-span-2">
            <PropertyDetails data={data} />
          </div>
        </div>
      </main>
    </div>
  );
}
