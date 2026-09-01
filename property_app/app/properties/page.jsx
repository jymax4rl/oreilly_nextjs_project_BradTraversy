import React from "react";
import HomeProperties from "@/components/HomeProperties";
import Property from "@/models/Property";
import connectToDatabase from "@/config/database";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import { attachOwnerProfiles } from "@/utils/user/attachOwnerProfiles";
import { withApprovedListingFilter } from "@/utils/listingApproval";
import { ensurePropertySlugs } from "@/utils/listings/propertySlug";
import { redactPreviewLockedCatalogFields } from "@/utils/listings/previewLockedHost";

export async function generateMetadata({ searchParams }) {
  const params = (await searchParams) || {};
  const location = String(params.location || "").trim();
  if (location) {
    return {
      title: `Vacation rentals in ${location}`,
      description: `Browse Kama Properties vacation rentals in ${location} — African stays with beds, baths, and nightly rates.`,
      alternates: {
        canonical: `/properties?location=${encodeURIComponent(location)}`,
      },
    };
  }
  return {
    title: "Vacation rentals in Africa",
    description:
      "Browse Kama Properties stays across Senegal, Ghana, Egypt, Morocco, South Africa, and Tanzania.",
    alternates: { canonical: "/properties" },
  };
}

// Listings need a live DB - do not prerender at image-build time (no secrets in Docker build).
export const dynamic = "force-dynamic";

function parsePositiveInt(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

function renderPropertiesList({
  initialProperties,
  locationQuery,
  typeQuery,
  minPrice,
  maxPrice,
  minBeds,
  minBaths,
  hideSearchToolbar = false,
  maxProperties,
}) {
  let list = initialProperties;
  if (typeof maxProperties === "number" && maxProperties > 0) {
    list = initialProperties.slice(0, maxProperties);
  }

  return (
    <div className="min-h-screen min-w-full overflow-x-hidden md:pt-[10vh]">
      <HomeProperties
        key={`${locationQuery || "all"}-${typeQuery || "all"}-${minPrice ?? ""}-${maxPrice ?? ""}-${minBeds ?? ""}-${minBaths ?? ""}`}
        initialProperties={list}
        searchQuery={locationQuery || ""}
        typeFilter={typeQuery || ""}
        minPrice={minPrice}
        maxPrice={maxPrice}
        minBeds={minBeds}
        minBaths={minBaths}
        hideSearchToolbar={hideSearchToolbar}
      />
    </div>
  );
}

const PropertiesPage = async ({
  searchParams,
  hideSearchToolbar = false,
  maxProperties,
}) => {
  const params = (await searchParams) || {};
  const locationQuery = params?.location?.trim();
  const typeQuery = params?.type;
  const minPrice = params?.minPrice ? Number(params.minPrice) : null;
  const maxPrice = params?.maxPrice ? Number(params.maxPrice) : null;
  const minBeds = parsePositiveInt(params?.minBeds);
  const minBaths = parsePositiveInt(params?.minBaths);

  const emptyList = () =>
    renderPropertiesList({
      initialProperties: [],
      locationQuery,
      typeQuery,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
      hideSearchToolbar,
      maxProperties,
    });

  if (!process.env.MONGODB_URI) {
    return emptyList();
  }

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

  if (minBeds != null) {
    mongoQuery.beds = { $gte: minBeds };
  }

  if (minBaths != null) {
    mongoQuery.baths = { $gte: minBaths };
  }

  const hasFilters =
    locationQuery ||
    (typeQuery && typeQuery !== "All Properties") ||
    minPrice != null ||
    maxPrice != null ||
    minBeds != null ||
    minBaths != null;
  if (!hasFilters) {
    mongoQuery.is_featured = false;
  }

  try {
    await connectToDatabase();
    const properties = await Property.find(
      withApprovedListingFilter(mongoQuery),
    ).lean();
    const serializedProperties = redactPreviewLockedCatalogFields(
      await attachOwnerProfiles(
        (await ensurePropertySlugs(properties)).map(serializePropertyForClient),
      ),
    );

    return renderPropertiesList({
      initialProperties: serializedProperties,
      locationQuery,
      typeQuery,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
      hideSearchToolbar,
      maxProperties,
    });
  } catch (error) {
    console.error("Properties page failed:", error);
    return emptyList();
  }
};

export default PropertiesPage;
