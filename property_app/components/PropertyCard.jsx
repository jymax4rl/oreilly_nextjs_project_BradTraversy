"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Bed, Bath, Ruler, MapPin, Heart } from "lucide-react";
import { formatCurrency } from "../utils/currencyUtils";
import { useCurrency } from "@/utils/CurrencyContext";
import { propertyCardImageUrl } from "@/utils/propertyImageUrl";
import { useSession } from "next-auth/react";

const PropertyCard = ({ property, isSaved = false }) => {
  const { data: session } = useSession();
  const { currencyCode, rates } = useCurrency();
  const {
    name,
    type,
    location,
    beds,
    baths,
    square_feet,
    rates: propertyRates,
    images,
    is_featured,
    _id,
  } = property;

  // Initialize from prop (server knows if it's saved)
  const [isLiked, setIsLiked] = useState(isSaved);
  const [isLoading, setIsLoading] = useState(false);

  const mainImage = propertyCardImageUrl(images);

  const getDisplayPrice = (ratesObj) => {
    if (!ratesObj) return { price: "N/A", label: "" };
    const currentRate = rates[currencyCode];
    const currentSymbol = currencyCode === "USD" ? "$" : currencyCode;

    if (ratesObj.nightly) {
      return {
        price: formatCurrency(ratesObj.nightly, currentRate, currentSymbol),
        label: "/ night",
      };
    }
    if (ratesObj.weekly) {
      return {
        price: formatCurrency(ratesObj.weekly, currentRate, currentSymbol),
        label: "/ week",
      };
    }
    if (ratesObj.monthly) {
      return {
        price: formatCurrency(ratesObj.monthly, currentRate, currentSymbol),
        label: "/ month",
      };
    }
    return { price: "Contact", label: "for rates" };
  };

  const displayRate = getDisplayPrice(propertyRates);

  const handleLikeToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      // Redirect to sign in if not logged in
      window.location.href = "/login";
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/bookmarks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: _id }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.isBookmarked);
      } else {
        console.error("Bookmark error:", data);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="group bg-white rounded-3xl overflow-hidden flex flex-col h-full border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
      <Link href={`/properties/${_id}`}>
        <div className="relative cursor-pointer h-72 overflow-hidden">
          <Image
            loading="eager"
            src={mainImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10 max-w-[85%]">
            {is_featured && (
              <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                Featured
              </span>
            )}
            <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
              {type}
            </span>
            <MobileMoneyBadge currencyCode={currencyCode} />
          </div>

          {/* Price Tag Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
            <div className="text-white">
              <p className="text-2xl font-bold tracking-tight shadow-sm filter drop-shadow-sm">
                {displayRate.price}
                <span className="text-sm font-medium text-white/90 ml-1">
                  {displayRate.label}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Like Button */}
      <button
        onClick={handleLikeToggle}
        disabled={isLoading}
        className="absolute cursor-pointer top-4 right-4 z-20 p-2.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white transition-colors duration-200 group/heart focus:outline-none disabled:opacity-50"
      >
        <Heart
          size={18}
          className={`transition-colors duration-200 ${
            isLiked
              ? "fill-red-500 text-red-500"
              : "text-white group-hover/heart:text-gray-900"
          }`}
        />
      </button>

      <Link href={`/properties/${_id}`}>
        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-4">
            <h3
              className="text-xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1"
              title={name}
            >
              {name}
            </h3>
            <div className="flex items-center text-gray-500 text-sm font-medium">
              <MapPin size={16} className="text-gray-400 mr-1.5" />
              <p>
                {location?.city}, {location?.country}
              </p>
            </div>
          </div>

          <div className="mt-auto border-t border-dashed border-gray-200 pt-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col items-center">
                <span className="flex items-center text-gray-900 font-bold">
                  <Bed
                    size={18}
                    className="mr-2 text-indigo-500"
                    strokeWidth={2.5}
                  />
                  {beds}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mt-0.5">
                  Beds
                </span>
              </div>

              <div className="w-px h-8 bg-gray-200"></div>

              <div className="flex flex-col items-center">
                <span className="flex items-center text-gray-900 font-bold">
                  <Bath
                    size={18}
                    className="mr-2 text-indigo-500"
                    strokeWidth={2.5}
                  />
                  {baths}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mt-0.5">
                  Baths
                </span>
              </div>

              <div className="w-px h-8 bg-gray-200"></div>

              <div className="flex flex-col items-center">
                <span className="flex items-center text-gray-900 font-bold">
                  <Ruler
                    size={18}
                    className="mr-2 text-indigo-500"
                    strokeWidth={2.5}
                  />
                  {square_feet?.toLocaleString()}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mt-0.5">
                  Sq Ft
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PropertyCard;
