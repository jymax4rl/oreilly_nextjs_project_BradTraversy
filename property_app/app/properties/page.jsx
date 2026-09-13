import React from "react";
import HomeProperties from "@/components/HomeProperties";
import Property from "@/models/Property";
import connectToDatabase from "@/config/database";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import { attachOwnerProfiles } from "@/utils/user/attachOwnerProfiles";
import { withApprovedListingFilter } from "@/utils/listingApproval";
import { ensurePropertySlugs } from "@/utils/listings/propertySlug";
import { redactPreviewLockedCatalogFields } from "@/utils/listings/previewLockedHost";
import { buildCatalogPropertyQuery } from "@/utils/listings/buildCatalogPropertyQuery";

export async function generateMetadata({ searchParams }) {
  const params = (await searchParams) || {};
  const location = String(params.location || "").trim();
  if (location) {
    return {
      title: `Vacation rentals in ${location}`,
      description: `Browse Isisel vacation rentals in ${location} — African stays with beds, baths, and nightly rates.`,
      alternates: {
        canonical: `/properties?location=${encodeURIComponent(location)}`,
      },
    };
  }
  return {
    title: "Vacation rentals in Africa",
    description:
      "Browse Isisel stays across Senegal, Ghana, Egypt, Morocco, South Africa, and Tanzania.",
    alternates: { canonical: "/properties" },
  };
}

// Listings need a live DB - do not prerender at image-build time (no secrets in Docker build).
export const dynamic = "force-dynamic";

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
  const { mongoQuery, filters } = buildCatalogPropertyQuery(params, {
    excludeFeaturedWhenUnfiltered: true,
  });
  const locationQuery = filters.location;
  const typeQuery = filters.type || params?.type || "";
  const { minPrice, maxPrice, minBeds, minBaths } = filters;

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
