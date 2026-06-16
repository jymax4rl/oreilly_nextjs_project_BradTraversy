import React from "react";
import HomeProperties from "@/components/HomeProperties";
import Property from "@/models/Property";
import connectToDatabase from "@/config/database";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";

export const dynamic = "force-dynamic";

const PropertiesPage = async ({ searchParams }) => {
  // Next.js 15+: searchParams is a Promise
  const params = await searchParams;
  const locationQuery = params?.location?.trim();
  const typeQuery = params?.type;
  const minPrice = params?.minPrice ? Number(params.minPrice) : null;
  const maxPrice = params?.maxPrice ? Number(params.maxPrice) : null;

  if (!process.env.MONGODB_URI) {
    return (
      <div className="min-h-screen min-w-full overflow-x-hidden md:pt-[10vh]">
        <HomeProperties
          initialProperties={[]}
          searchQuery={locationQuery || ""}
          typeFilter={typeQuery || ""}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
      </div>
    );
  }

  await connectToDatabase();

  // Build MongoDB query dynamically
  const mongoQuery = {};

  if (locationQuery) {
    const escaped = locationQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    mongoQuery.$or = [
      { "location.city": regex },
      { "location.state": regex },
      { "location.country": regex },
      { "location.street": regex },
      { "location.zipcode": regex },
      { name: regex },
    ];
  }

  if (typeQuery && typeQuery !== "All Properties") {
    mongoQuery.type = { $regex: new RegExp(typeQuery, "i") };
  }

  if (minPrice != null || maxPrice != null) {
    const priceCond = {};
    if (minPrice != null && !Number.isNaN(minPrice)) priceCond.$gte = minPrice;
    if (maxPrice != null && !Number.isNaN(maxPrice)) priceCond.$lte = maxPrice;

    if (Object.keys(priceCond).length) {
      mongoQuery.$and = mongoQuery.$and || [];
      mongoQuery.$and.push({
        $or: [
          { listingPrice: priceCond },
          {
            listingPrice: { $exists: false },
            "rates.nightly": priceCond,
          },
        ],
      });
    }
  }

  const hasFilters =
    locationQuery ||
    (typeQuery && typeQuery !== "All Properties") ||
    minPrice != null ||
    maxPrice != null;
  if (!hasFilters) {
    mongoQuery.is_featured = false;
  }

  const properties = await Property.find(mongoQuery).lean();

  const serializedProperties = properties.map(serializePropertyForClient);

  return (
    <div className="min-h-screen min-w-full overflow-x-hidden md:pt-[10vh]">
      <HomeProperties
        key={`${locationQuery || "all"}-${typeQuery || "all"}-${minPrice ?? ""}-${maxPrice ?? ""}`}
        initialProperties={serializedProperties}
        searchQuery={locationQuery || ""}
        typeFilter={typeQuery || ""}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />
    </div>
  );
};

export default PropertiesPage;
