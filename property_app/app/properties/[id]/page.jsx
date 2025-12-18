import React from "react";

import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import mongoose from "mongoose";
import DynamicProperty from "@/components/dynamicComponents/DynamicProperty";

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
    <div>
      <DynamicProperty property={property} />
    </div>
  );
}
