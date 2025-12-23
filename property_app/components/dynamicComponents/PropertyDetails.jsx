import React from "react";
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
  X,
} from "lucide-react";
import { useCurrency } from "@/utils/CurrencyContext";
import { formatCurrency } from "@/utils/currencyUtils";

function PropertyDetails({ data }) {
  const { currencyCode, rates } = useCurrency();
  return (
    <>
      {/* Left Column: Property Details */}
      <div className="lg:col-span-2 space-y-12">
        {/* Stats Bar */}
        <div className="flex items-center gap-8 py-6 border-y border-slate-100">
          <div className="flex items-center gap-3">
            <Bed className="text-slate-900" size={24} strokeWidth={1.5} />
            <span className="font-medium text-lg">
              {data.beds}{" "}
              <span className="font-normal text-slate-500 text-base">Beds</span>
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
            <Maximize className="text-slate-900" size={24} strokeWidth={1.5} />
            <span className="font-medium text-lg">
              {data.square_feet?.toLocaleString()}{" "}
              <span className="font-normal text-slate-500 text-base">sqft</span>
            </span>
          </div>
        </div>
        {/* rates per period */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-slate-900">
            Rates per period
          </h2>
          <div className="flex items-center gap-10">
            <div className="text-slate-600 leading-relaxed text-lg font-light whitespace-pre-line">
              {data.rates.monthly ? (
                <div className="flex items-center gap-2">
                  <p>Monthly{" : "}</p>
                  <p className="font-bold">
                    {formatCurrency(
                      data.rates.monthly,
                      rates[currencyCode],
                      currencyCode === "USD" ? "$" : currencyCode
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="flex items-center gap-2 text-red-500">
                    Monthly:
                    {<X size={16} strokeWidth={5} />}
                  </p>
                </div>
              )}
            </div>
            <div className="text-slate-600 leading-relaxed text-lg font-light whitespace-pre-line">
              {data.rates.weekly ? (
                <div className="flex items-center gap-2">
                  <p>Weekly{" : "}</p>
                  <p className="font-bold">
                    {formatCurrency(
                      data.rates.weekly,
                      rates[currencyCode],
                      currencyCode === "USD" ? "$" : currencyCode
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="flex items-center gap-2 text-red-500">
                    weekly : <X size={16} strokeWidth={5} />
                  </p>
                </div>
              )}
            </div>
            <div className="text-slate-600 leading-relaxed text-lg font-light whitespace-pre-line">
              {data.rates.nightly ? (
                <div className="flex items-center gap-2">
                  <p>Nightly{" : "}</p>
                  <p className="font-bold">
                    {formatCurrency(
                      data.rates.nightly,
                      rates[currencyCode],
                      currencyCode === "USD" ? "$" : currencyCode
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="flex items-center gap-2 text-red-500">
                    Nightly : <X size={16} strokeWidth={5} />
                  </p>
                </div>
              )}
            </div>
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
                <Check size={18} className="text-slate-900" strokeWidth={2.5} />
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
    </>
  );
}

export default PropertyDetails;
