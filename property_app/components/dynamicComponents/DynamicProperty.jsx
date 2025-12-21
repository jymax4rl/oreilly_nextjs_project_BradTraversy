"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import RightColumn from "./RightColumn";
import PropertyDetails from "./PropertyDetails";
import {
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Star,
  Bed,
  Bath,
  Maximize,
  Check,
  Mail,
  Phone,
} from "lucide-react";
import { useCurrency } from "@/utils/CurrencyContext";
import { formatCurrency } from "@/utils/currencyUtils";

export default function DynamicProperty({ property }) {
  // Fallback for preview if property prop is missing
  const data = property;
  const { currencyCode, rates } = useCurrency();

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-blue-100 pb-20">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Header & Title Section */}
        <header className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex cursor-pointer items-center px-4 py-1.5 rounded-xl bg-blue-900 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/30 transform transition-transform hover:-translate-y-0.5">
                {data.type}
              </span>
              {data.is_featured && (
                <span className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-1.5 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-black/30 transform transition-transform hover:-translate-y-0.5">
                  <Star size={12} fill="currentColor" />
                  Featured
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-thin font-sans tracking-tight text-slate-900">
              {data.name}
            </h1>
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <MapPin size={18} className="text-slate-900" />
              <span>
                {data.location.street}, {data.location.city},{" "}
                {data.location.country}
              </span>
            </div>
          </div>

          {/* Minimalist Bento-Grid Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[400px] md:h-[500px] rounded-2xl overflow-hidden">
            {/* Main Hero Image */}
            <div className="md:col-span-2 relative h-full bg-slate-100 group">
              <Image
                src={`/properties/${data.images?.[0] || "default.jpg"}`}
                alt={data.name}
                fill
                priority
                quality={90}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                className="object-cover cursor-pointer transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>

            {/* Secondary Images Column */}
            <div className="hidden  md:grid md:col-span-1 grid-rows-2 gap-4 h-full">
              <div className="relative cursor-pointer h-full bg-slate-100 group">
                <Image
                  src={`/properties/${data.images[1] || "default.jpg"}`}
                  alt="Interior detail"
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover cursor-pointer transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="relative h-full bg-slate-100 group">
                <Image
                  src={`/properties/${data.images[2] || "default.jpg"}`}
                  alt="Interior detail"
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover cursor-pointer transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Third Column with "Show All" overlay */}
            <div className="hidden md:block md:col-span-1 relative h-full bg-slate-100 group">
              <Image
                src={`/properties/${
                  data.images[3] || data.images[0] || "default.jpg"
                }`}
                alt="Property detail"
                fill
                quality={90}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover cursor-pointer transition-transform duration-700 group-hover:scale-105"
              />
              {data.images.length > 4 && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white font-medium backdrop-blur-sm cursor-pointer hover:bg-slate-900/60 transition-colors">
                  Show all photos
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Layout: 2/3 Left, 1/3 Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24 relative">
          {/* Left Column: Property Details */}
          <PropertyDetails data={data} />
          <RightColumn data={data} />
        </div>
      </main>
    </div>
  );
}
