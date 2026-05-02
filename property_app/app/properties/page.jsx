import React from "react";
import HomeProperties from "@/components/HomeProperties";
import Property from "@/models/Property";
import connectToDatabase from "@/config/database";

const PropertiesPage = async ({ searchParams }) => {
  // Next.js 15+: searchParams is a Promise
  const params = await searchParams;
  const locationQuery = params?.location?.trim();
  const typeQuery = params?.type;

  await connectToDatabase();

  // Build MongoDB query dynamically
  const mongoQuery = {};

  // Location search: case-insensitive regex across ALL location fields + name
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

  // Property type filter
  if (typeQuery && typeQuery !== "All Properties") {
    mongoQuery.type = { $regex: new RegExp(typeQuery, "i") };
  }

  // If no filters, show non-featured (original behavior)
  const hasFilters =
    locationQuery || (typeQuery && typeQuery !== "All Properties");
  if (!hasFilters) {
    mongoQuery.is_featured = false;
  }

  const properties = await Property.find(mongoQuery).lean();

  // Serialize ObjectIds
  const serializedProperties = properties.map((property) => ({
    ...property,
    _id: property._id.toString(),
    owner: property.owner?.toString?.() || property.owner,
  }));

  return (
    <div>
      <HomeProperties
        key={`${locationQuery || "all"}-${typeQuery || "all"}`} // ← ADD THIS
        initialProperties={serializedProperties}
        searchQuery={locationQuery || ""}
        typeFilter={typeQuery || ""}
      />
    </div>
  );
};

export default PropertiesPage;
