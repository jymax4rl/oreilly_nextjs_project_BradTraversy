import React from "react";
// import Link from 'next/link'; // UNCOMMENT in your local Next.js project
import Image from "next/image";

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
      {/* Minimal Navbar with Backdrop Blur */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Replaced Link with a for preview compatibility */}
          <a
            href="/properties"
            className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <div className="p-2 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors">
              <ArrowLeft size={16} />
            </div>
            Back to Listings
          </a>
          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors">
              <Share2 size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-50 text-slate-500 hover:text-rose-500 transition-colors">
              <Heart size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Header & Title Section */}
        <header className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs font-bold tracking-wider uppercase text-blue-600">
              <span>{data.type}</span>
              {data.is_featured && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star size={12} fill="currentColor" /> Featured
                  </span>
                </>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
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
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>

            {/* Secondary Images Column */}
            <div className="hidden md:grid md:col-span-1 grid-rows-2 gap-4 h-full">
              <div className="relative h-full bg-slate-100 group">
                <Image
                  src={`/properties/${data.images[1] || "default.jpg"}`}
                  alt="Interior detail"
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="relative h-full bg-slate-100 group">
                <Image
                  src={`/properties/${data.images[2] || "default.jpg"}`}
                  alt="Interior detail"
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
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
                className="object-cover transition-transform duration-700 group-hover:scale-105"
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
          <div className="lg:col-span-2 space-y-12">
            {/* Stats Bar */}
            <div className="flex items-center gap-8 py-6 border-y border-slate-100">
              <div className="flex items-center gap-3">
                <Bed className="text-slate-900" size={24} strokeWidth={1.5} />
                <span className="font-medium text-lg">
                  {data.beds}{" "}
                  <span className="font-normal text-slate-500 text-base">
                    Beds
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Bath className="text-slate-900" size={24} strokeWidth={1.5} />
                <span className="font-medium text-lg">
                  {data.baths}{" "}
                  <span className="font-normal text-slate-500 text-base">
                    Baths
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Maximize
                  className="text-slate-900"
                  size={24}
                  strokeWidth={1.5}
                />
                <span className="font-medium text-lg">
                  {data.square_feet?.toLocaleString()}{" "}
                  <span className="font-normal text-slate-500 text-base">
                    sqft
                  </span>
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-slate-900">
                About this space
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg font-light whitespace-pre-line">
                {data.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div>
              <h2 className="text-2xl font-bold mb-8 text-slate-900">
                What this place offers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                {data.amenities?.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 text-slate-700 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <Check
                      size={18}
                      className="text-slate-900"
                      strokeWidth={2.5}
                    />
                    <span className="font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimalist Host Section */}
            <div className="pt-10 border-t border-slate-100">
              <h2 className="text-2xl font-bold mb-6">
                Hosted by {data.seller_info?.name}
              </h2>
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400 border border-slate-200">
                  {data.seller_info?.name?.charAt(0)}
                </div>
                <div className="space-y-2">
                  <p className="text-slate-500 font-medium">Property Owner</p>
                  <div className="flex flex-col sm:flex-row sm:gap-6 gap-2 text-slate-900 font-medium pt-1">
                    <span className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer group">
                      <Mail size={16} className="group-hover:text-blue-600" />{" "}
                      {data.seller_info?.email}
                    </span>
                    <span className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer group">
                      <Phone size={16} className="group-hover:text-blue-600" />{" "}
                      {data.seller_info?.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="relative">
            <div className="sticky top-32 p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 bg-white space-y-8">
              <div className="flex items-baseline justify-between">
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {data.rates.monthly
                      ? formatCurrency(
                          data.rates.monthly,
                          rates[currencyCode],
                          currencyCode === "USD" ? "$" : currencyCode
                        )
                      : formatCurrency(
                          data.rates.weekly,
                          rates[currencyCode],
                          currencyCode === "USD" ? "$" : currencyCode
                        )}
                  </span>
                  <span className="text-slate-500 font-medium">
                    {data.rates.monthly ? "/ month" : "/ week"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold bg-slate-50 px-2 py-1 rounded-md">
                  <Star size={14} className="fill-slate-900" /> 5.0
                </div>
              </div>

              {/* Date Selection Inputs */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer bg-white group">
                  <span className="block text-xs text-slate-500 uppercase font-bold mb-1 group-hover:text-blue-600">
                    Check-in
                  </span>
                  <span className="font-medium text-slate-900">Add date</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer bg-white group">
                  <span className="block text-xs text-slate-500 uppercase font-bold mb-1 group-hover:text-blue-600">
                    Check-out
                  </span>
                  <span className="font-medium text-slate-900">Add date</span>
                </div>
              </div>

              <button className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 text-lg">
                Reserve
              </button>

              <div className="text-center text-xs text-slate-400 font-medium">
                You won't be charged yet
              </div>

              {/* Price Breakdown */}
              <div className="pt-6 border-t border-slate-100 space-y-3 text-slate-600 text-sm">
                <div className="flex justify-between">
                  <span className="underline decoration-slate-300 decoration-dotted underline-offset-4">
                    Base price
                  </span>
                  <span>
                    {formatCurrency(
                      data.rates.weekly || data.rates.monthly,
                      rates[currencyCode],
                      currencyCode === "USD" ? "$" : currencyCode
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="underline decoration-slate-300 decoration-dotted underline-offset-4">
                    Cleaning fee
                  </span>
                  <span>$150</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-4 border-t border-slate-100 mt-4 text-base">
                  <span>Total</span>
                  <span>
                    {/* Simple total calculation example */}
                    {formatCurrency(
                      (data.rates.weekly || data.rates.monthly) + 150,
                      rates[currencyCode],
                      currencyCode === "USD" ? "$" : currencyCode
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
