import React from "react";
import Image from "next/image"; // Added next/image
import propertyData from "../properties.json"; // Adjust path based on where you saved the json file
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt } from "react-icons/fa";
import Button from "./Button";
import Link from "next/link";

// --- Child Component: The Single Property Card ---
const PropertyCard = ({ property }) => {
  const {
    name,
    type,
    location,
    beds,
    baths,
    square_feet,
    rates,
    images,
    is_featured,
  } = property;

  // Correct path to images in public folder
  const mainImage = `/properties/${images[0]}`;

  // Helper function to determine the best price rate to display
  const getDisplayPrice = (ratesObj) => {
    if (!ratesObj) return { price: "N/A", label: "" };

    // Prioritize showing nightly, then weekly, then monthly
    if (ratesObj.nightly) {
      return {
        price: `$${ratesObj.nightly.toLocaleString()}`,
        label: "/ night",
      };
    }
    if (ratesObj.weekly) {
      return { price: `$${ratesObj.weekly.toLocaleString()}`, label: "/ week" };
    }
    if (ratesObj.monthly) {
      return {
        price: `$${ratesObj.monthly.toLocaleString()}`,
        label: "/ month",
      };
    }

    return { price: "Contact", label: "for rates" };
  };

  const displayRate = getDisplayPrice(rates);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full border border-gray-100">
      {/* Image Section Container */}
      <Link href={"/properties/" + property._id}>
        <div className="relative cursor-pointer h-56 overflow-hidden group">
          <Image
            src={mainImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full cursor-pointer h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          />

          {/* Overlay Gradient for better text readability if needed */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {is_featured && (
              <span className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                Featured
              </span>
            )}
            <span className="bg-white/90 text-gray-800 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
              {type}
            </span>
          </div>

          {/* Price Badge (Bottom Right Over Image) */}
          <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg font-bold text-gray-900">
            <span className="text-lg">{displayRate.price}</span>
            <span className="text-gray-500 text-sm font-normal ml-1">
              {displayRate.label}
            </span>
          </div>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Location */}
        <div className="flex items-center text-gray-500 text-sm mb-2 space-x-1">
          <FaMapMarkerAlt className="text-indigo-500" />
          <p>
            {location.city}, {location.state}
          </p>
        </div>

        {/* Title */}
        <h3
          className="text-xl font-bold text-gray-900 mb-4 line-clamp-1"
          title={name}
        >
          {name}
        </h3>

        {/* Key Stats Row */}
        <div className="flex items-center justify-between text-gray-700 text-sm py-2 mt-auto px-2   ">
          <div className="flex items-center space-x-2">
            <FaBed className="text-black-400 text-s" />
            <span className="font-semibold">
              {beds}{" "}
              <span className="hidden sm:inline font-normal text-gray-500">
                Beds
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <FaBath className="text-black-400 text-s" />
            <span className="font-semibold">
              {baths}{" "}
              <span className="hidden sm:inline font-normal text-gray-500">
                Baths
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <FaRulerCombined className="text-black-400 text-s" />
            <span className="font-semibold">
              {square_feet.toLocaleString()}{" "}
              <span className="hidden sm:inline font-normal text-gray-500">
                sqft
              </span>
            </span>
          </div>
        </div>

        {/* View Details Button */}
        <Button
          text={"View Details"}
          link={"/properties/" + property._id}
          borderColor={"black"}
        ></Button>
      </div>
    </div>
  );
};

// --- Main Parent Component ---
const HomeProperties = () => {
  // In a real app, you might fetch this data in a useEffect hook.
  const properties = propertyData;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Featured Properties
          </h2>
          <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
            Explore our hand-picked selection of top-tier properties available
            for short-term and long-term stays.
          </p>
        </div>

        {/* The Grid Layout using Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {properties.map((property) => (
            // Using the _id as the unique key for React's reconciliation
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeProperties;
