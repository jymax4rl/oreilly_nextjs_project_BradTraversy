import React from "react";
import HomeProperties from "@/components/HomeProperties";
import Property from "@/models/Property";
import connectToDatabase from "@/config/database";
import { approvedListingQuery } from "@/utils/listingApproval";
import { serializePropertiesForClient } from "@/utils/serializePropertyClient";

export const dynamic = "force-dynamic";

const PropertiesPage = async ({ searchParams }) => {
  // Next.js 15+: searchParams is a Promise
  const params = await searchParams;
  const locationQuery = params?.location?.trim();
  const typeQuery = params?.type;

  const conditions = [approvedListingQuery()];

  if (locationQuery) {
    const escaped = locationQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    conditions.push({
      $or: [
        { "location.city": regex },
        { "location.state": regex },
        { "location.country": regex },
        { "location.street": regex },
        { "location.zipcode": regex },
        { name: regex },
      ],
    });
  }

  if (typeQuery && typeQuery !== "All Properties") {
    conditions.push({ type: { $regex: new RegExp(typeQuery, "i") } });
  }

  const hasFilters =
    locationQuery || (typeQuery && typeQuery !== "All Properties");
  if (!hasFilters) {
    conditions.push({ is_featured: false });
  }

  const mongoQuery =
    conditions.length === 1 ? conditions[0] : { $and: conditions };

  let properties = [];
  try {
    await connectToDatabase();
    properties = await Property.find(mongoQuery).lean();
  } catch (error) {
    console.error("PropertiesPage: failed to load properties", error);
  }

  const serializedProperties = serializePropertiesForClient(properties);

  return (
    <div className="min-h-screen min-w-full overflow-x-hidden md:pt-[10vh]">
      <HomeProperties
        key={`${locationQuery || "all"}-${typeQuery || "all"}`}
        initialProperties={serializedProperties}
        searchQuery={locationQuery || ""}
        typeFilter={typeQuery || ""}
      />
    </div>
  );
};

export default PropertiesPage;
