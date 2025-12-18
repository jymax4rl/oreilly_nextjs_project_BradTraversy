import React from "react";

import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import mongoose from "mongoose";
import Image from "next/image";
import Link from "next/link";

import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  CheckCircle,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  Share2,
  Heart,
  Info,
  ShieldCheck,
  Star,
} from "lucide-react";

export default async function PropertyPage({ params }) {
  // Unwrapping params for Next.js 15
  const resolvedParams = await params;
  const { id } = resolvedParams;

  let property = null;

  try {
    // Connect to database first!
    await connectToDatabase();

    console.log("🔍 Checking ID:", id, "| Type:", typeof id);
    // Check if the ID is a valid MongoDB ObjectId to avoid Casting errors
    if (mongoose.Types.ObjectId.isValid(id)) {
      property = await Property.findOne({ _id: id }).lean();
    } else {
      property = await mongoose.connection.db
        .collection("Properties")
        .findOne({ _id: id });
    }
  } catch (error) {
    console.error("Database error:", error);
  }

  // Handle case where property is not found
  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 max-w-lg w-full">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Info size={48} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Listing Not Found
          </h1>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">
            We searched our records but couldn&apos;t find a property with ID:{" "}
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {id}
            </span>
            .
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center justify-center w-full px-8 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl gap-3 active:scale-95 text-lg"
          >
            <ArrowLeft size={20} /> Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-24 font-sans text-slate-900">
      {/* Cinematic Hero Header */}
      <section className="bg-slate-950 pt-20 pb-44 px-6 text-white relative overflow-hidden">
        {/* Dynamic Light Effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500 rounded-full blur-[180px]"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[180px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <nav className="mb-12 flex justify-between items-center">
            <Link
              href="/properties"
              className="group inline-flex items-center gap-3 text-slate-400 hover:text-white transition-all font-black text-xs uppercase tracking-[0.2em]"
            >
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <ArrowLeft size={18} />
              </div>
              Back to Listings
            </Link>
            <div className="flex gap-4">
              <button
                title="Share Property"
                className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition backdrop-blur-xl flex items-center justify-center"
              >
                <Share2 size={22} />
              </button>
              <button
                title="Add to Favorites"
                className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition text-rose-400 backdrop-blur-xl flex items-center justify-center"
              >
                <Heart size={22} />
              </button>
            </div>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="max-w-4xl">
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="px-5 py-2 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-blue-500/20">
                  {property.type}
                </div>
                {property.is_featured && (
                  <div className="px-5 py-2 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-amber-500/20 flex items-center gap-2">
                    <Star size={12} fill="currentColor" /> Featured
                  </div>
                )}
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                {property.name}
              </h1>
              <div className="flex items-center text-slate-400 text-xl md:text-2xl font-medium">
                <MapPin
                  className="mr-4 flex-shrink-0 text-blue-500"
                  size={28}
                />
                <address className="not-italic opacity-80 border-l border-white/10 pl-4">
                  {property.location.street}, {property.location.city},{" "}
                  {property.location.country}
                </address>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-2xl min-w-[320px] ring-1 ring-white/20">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                Starting Rate
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-black text-white leading-none">
                  $
                  {(
                    property.rates?.nightly ||
                    property.rates?.weekly ||
                    property.rates?.monthly ||
                    0
                  ).toLocaleString()}
                </span>
                <span className="text-slate-400 font-bold text-xl">/wk</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main Layout - Content */}
          <div className="lg:col-span-2 space-y-16">
            {/* Immersive Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[550px] md:h-[650px]">
              <div className="md:col-span-8 bg-slate-200 rounded-[3.5rem] overflow-hidden shadow-2xl border-8 border-white group relative">
                <Image
                  fill
                  src={`/properties/${property.images?.[0] || "default.jpg"}`}
                  alt={property.name}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                  className="object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-6">
                <div className="bg-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl border-8 border-white group relative">
                  <Image
                    fill
                    src={`/properties/${property.images?.[1] || "default.jpg"}`}
                    alt=""
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="bg-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl border-8 border-white group relative">
                  <Image
                    fill
                    src={`/properties/${property.images?.[2] || "default.jpg"}`}
                    alt=""
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {property.images?.length > 3 && (
                    <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-white font-black text-3xl backdrop-blur-md">
                      +{property.images.length - 3} More
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Core Property Stats */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-12 flex flex-wrap justify-around items-center gap-10">
              <div className="flex flex-col items-center group">
                <div className="w-20 h-20 bg-slate-50 text-slate-900 rounded-3xl flex items-center justify-center mb-5 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 border border-slate-100 group-hover:border-blue-500">
                  <Bed size={36} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">
                  Beds
                </span>
                <span className="text-3xl font-black text-slate-900">
                  {property.beds}
                </span>
              </div>
              <div className="h-20 w-px bg-slate-100 hidden sm:block"></div>
              <div className="flex flex-col items-center group">
                <div className="w-20 h-20 bg-slate-50 text-slate-900 rounded-3xl flex items-center justify-center mb-5 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 border border-slate-100 group-hover:border-blue-500">
                  <Bath size={36} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">
                  Baths
                </span>
                <span className="text-3xl font-black text-slate-900">
                  {property.baths}
                </span>
              </div>
              <div className="h-20 w-px bg-slate-100 hidden sm:block"></div>
              <div className="flex flex-col items-center group">
                <div className="w-20 h-20 bg-slate-50 text-slate-900 rounded-3xl flex items-center justify-center mb-5 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 border border-slate-100 group-hover:border-blue-500">
                  <Maximize size={36} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">
                  Area
                </span>
                <span className="text-3xl font-black text-slate-900">
                  {(property.square_feet || 0).toLocaleString()}{" "}
                  <span className="text-sm font-medium opacity-40">sqft</span>
                </span>
              </div>
            </div>

            {/* High-Impact Description */}
            <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 p-16">
              <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tight leading-none">
                The Space
              </h2>
              <div className="text-slate-600 leading-[1.8] text-2xl font-light opacity-90 whitespace-pre-line tracking-tight">
                {property.description}
              </div>
            </div>

            {/* Amenities Showcase */}
            <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 p-16">
              <h2 className="text-4xl font-black text-slate-900 mb-12 tracking-tight leading-none">
                Curated Amenities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {property.amenities?.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-5 group">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.25rem] flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-sm border border-emerald-100">
                      <CheckCircle size={28} />
                    </div>
                    <span className="text-slate-800 font-black text-lg tracking-tight">
                      {amenity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Booking & Host */}
          <aside className="space-y-12">
            {/* Booking Card */}
            <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100 overflow-hidden sticky top-12 ring-1 ring-slate-100">
              <div className="bg-slate-950 p-10 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Calendar size={120} />
                </div>
                <h3 className="text-3xl font-black mb-1 relative z-10 tracking-tight">
                  Reserve Space
                </h3>
                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase relative z-10">
                  Limited Availability
                </p>
              </div>
              <div className="p-12 space-y-12">
                <div className="space-y-8">
                  {property.rates?.nightly && (
                    <div className="flex justify-between items-end py-4 border-b border-slate-50">
                      <span className="text-slate-500 font-black text-lg uppercase tracking-widest text-[10px]">
                        Nightly
                      </span>
                      <span className="text-4xl font-black text-slate-900">
                        ${property.rates.nightly.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {property.rates?.weekly && (
                    <div className="flex justify-between items-end py-4 border-b border-slate-50">
                      <span className="text-slate-500 font-black text-lg uppercase tracking-widest text-[10px]">
                        Weekly
                      </span>
                      <span className="text-4xl font-black text-blue-700">
                        ${property.rates.weekly.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {property.rates?.monthly && (
                    <div className="flex justify-between items-end py-4 border-b border-slate-50">
                      <span className="text-slate-500 font-black text-lg uppercase tracking-widest text-[10px]">
                        Monthly
                      </span>
                      <span className="text-4xl font-black text-blue-700">
                        ${property.rates.monthly.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-7 rounded-[2rem] transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 active:scale-95 text-xl tracking-tight">
                    Check Dates
                  </button>
                  <button className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 font-black py-7 rounded-[2rem] hover:bg-slate-100 transition-all text-xl tracking-tight">
                    Send Inquiry
                  </button>
                </div>

                <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex gap-5 items-start">
                  <div className="text-blue-500 mt-1 flex-shrink-0 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                    <ShieldCheck size={24} />
                  </div>
                  <p className="text-slate-600 text-sm font-bold leading-relaxed tracking-tight">
                    Safe-Stay Guarantee included. Your payment is protected
                    until 24 hours after check-in.
                  </p>
                </div>
              </div>
            </div>

            {/* Host Profile Card */}
            <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-[-40px] right-[-40px] p-10 text-white/5 group-hover:text-blue-500/10 transition-colors pointer-events-none">
                <Mail size={220} />
              </div>

              <h3 className="text-3xl font-black mb-12 relative z-10 tracking-tight">
                The Host
              </h3>

              <div className="flex items-center gap-8 mb-12 relative z-10">
                <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-2xl ring-4 ring-white/5 group-hover:rotate-6 transition-transform">
                  {property.seller_info?.name?.charAt(0) || "H"}
                </div>
                <div>
                  <h4 className="text-3xl font-black mb-2 tracking-tight">
                    {property.seller_info?.name}
                  </h4>
                  <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black bg-emerald-500/20 text-emerald-400 uppercase tracking-[0.2em]">
                    Pro Manager
                  </span>
                </div>
              </div>

              <div className="space-y-6 mb-12 relative z-10">
                <div className="flex items-center gap-6 text-slate-400 group/link cursor-pointer hover:text-white transition-colors">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 border border-white/10 group-hover/link:bg-blue-600 group-hover/link:text-white transition-all">
                    <Phone size={24} strokeWidth={2.5} />
                  </div>
                  <span className="font-black text-xl tracking-tight">
                    {property.seller_info?.phone}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-slate-400 group/link cursor-pointer hover:text-white transition-colors">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 border border-white/10 group-hover/link:bg-blue-600 group-hover/link:text-white transition-all">
                    <Mail size={24} strokeWidth={2.5} />
                  </div>
                  <span className="truncate font-black text-xl tracking-tight opacity-90">
                    {property.seller_info?.email}
                  </span>
                </div>
              </div>

              <button className="w-full py-7 bg-white text-slate-950 rounded-[2rem] font-black transition-all hover:bg-blue-50 hover:shadow-2xl flex items-center justify-center gap-4 relative z-10 active:scale-95 text-xl tracking-tight">
                Connect Directly
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
