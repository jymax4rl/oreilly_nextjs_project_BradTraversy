import React from "react";
import HomeProperties from "@/components/HomeProperties";
import ComingSoonStays from "@/components/home/ComingSoonStays";
import Property from "@/models/Property";
import connectToDatabase from "@/config/database";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import { attachOwnerProfiles } from "@/utils/user/attachOwnerProfiles";
import { ensurePropertySlugs } from "@/utils/listings/propertySlug";
import { redactPreviewLockedCatalogFields } from "@/utils/listings/previewLockedHost";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { canBrowseListingCatalog } from "@/utils/listings/catalogBeta";
import {
  buildCatalogMongoQuery,
  parseCatalogSearchParams,
} from "@/utils/listings/catalogQuery";

export async function generateMetadata({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!canBrowseListingCatalog(session)) {
    return {
      title: "Stays coming soon",
      description:
        "Isisel stays across Africa are opening soon. Hosts can preview the catalogue; guests will browse at launch.",
      robots: { index: true, follow: true },
      alternates: { canonical: "/properties" },
    };
  }

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

export const dynamic = "force-dynamic";

function renderPropertiesList({
  initialProperties,
  locationQuery,
  typeQuery,
  minPrice,
  maxPrice,
  minBeds,
  minBaths,
  checkIn,
  checkOut,
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
        key={`${locationQuery || "all"}-${typeQuery || "all"}-${minPrice ?? ""}-${maxPrice ?? ""}-${minBeds ?? ""}-${minBaths ?? ""}-${checkIn || ""}-${checkOut || ""}`}
        initialProperties={list}
        searchQuery={locationQuery || ""}
        typeFilter={typeQuery || ""}
        minPrice={minPrice}
        maxPrice={maxPrice}
        minBeds={minBeds}
        minBaths={minBaths}
        checkIn={checkIn || ""}
        checkOut={checkOut || ""}
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
  const session = await getServerSession(authOptions);
  if (!canBrowseListingCatalog(session)) {
    return <ComingSoonStays variant={hideSearchToolbar ? "home" : "page"} />;
  }

  const raw = (await searchParams) || {};
  const parsed = parseCatalogSearchParams(raw);
  const locationQuery = parsed.location;
  const typeQuery = parsed.type;
  const { minPrice, maxPrice, minBeds, minBaths, checkIn, checkOut } = parsed;

  const emptyList = () =>
    renderPropertiesList({
      initialProperties: [],
      locationQuery,
      typeQuery,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
      checkIn,
      checkOut,
      hideSearchToolbar,
      maxProperties,
    });

  if (!process.env.MONGODB_URI) {
    return emptyList();
  }

  const mongoQuery = buildCatalogMongoQuery({
    location: locationQuery,
    type: typeQuery,
    minPrice,
    maxPrice,
    minBeds,
    minBaths,
  });

  try {
    await connectToDatabase();
    const properties = await Property.find(mongoQuery).lean();
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
      checkIn,
      checkOut,
      hideSearchToolbar,
      maxProperties,
    });
  } catch (error) {
    console.error("Properties page failed:", error);
    return emptyList();
  }
};

export default PropertiesPage;
