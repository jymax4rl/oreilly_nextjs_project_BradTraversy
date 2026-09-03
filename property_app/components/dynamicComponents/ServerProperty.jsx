import React from "react";
import { propertyImageUrl } from "@/utils/propertyImageUrl";
import { isPubliclyVisibleListing } from "@/utils/listingApproval";
import { getPrimaryDisplayRate } from "@/utils/propertyRates";

function stripHtml(html = "") {
  return String(html).replace(/<\/?[^>]+(>|$)/g, "");
}
function truncate(str = "", max = 160) {
  if (!str) return "";
  return str.length <= max ? str : str.slice(0, max - 3).trim() + "...";
}

export default function ServerProperty({ property, canonicalUrl }) {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com"
  ).replace(/\/$/, "");

  const rawImagePath = property.images?.[0];
  const localImagePath = propertyImageUrl(rawImagePath || null);
  const absoluteImageUrl = localImagePath.startsWith("http")
    ? localImagePath
    : `${siteUrl}${localImagePath}`;

  const raw = stripHtml(property.description || "");
  const shortDescription = truncate(raw, 150);
  const primaryRate = getPrimaryDisplayRate(property.rates);
  const offerPrice = Number(primaryRate?.amount);
  const hasOffer = Number.isFinite(offerPrice) && offerPrice > 0;

  const publicStay = isPubliclyVisibleListing(property);
  const showStreet = Boolean(property.location?.showExactLocation);
  const occupancy =
    Number(property.listing?.maxGuests) ||
    Number(property.beds) * 2 ||
    2;
  const placeType =
    property.listing?.privacyType === "private_room"
      ? "PrivateRoom"
      : property.listing?.privacyType === "shared_room"
        ? "SharedRoom"
        : "EntirePlace";
  const lat = Number(property.location?.lat);
  const lng = Number(property.location?.lng);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: property.name,
    description: shortDescription,
    url: canonicalUrl,
    identifier: property.slug || property._id || canonicalUrl,
    image: [absoluteImageUrl],
    address: {
      "@type": "PostalAddress",
      ...(showStreet && property.location?.street
        ? { streetAddress: property.location.street }
        : {}),
      addressLocality: property.location?.city || "",
      addressRegion: property.location?.state || property.location?.region || "",
      addressCountry: property.location?.country || "",
    },
    ...(Number.isFinite(lat) && Number.isFinite(lng)
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: lat,
            longitude: lng,
          },
        }
      : {}),
    numberOfBedrooms: Number(property.beds) || undefined,
    numberOfBathroomsTotal: Number(property.baths) || undefined,
    occupancy: {
      "@type": "QuantitativeValue",
      value: occupancy,
    },
    containsPlace: {
      "@type": "Accommodation",
      additionalType: placeType,
      name: property.name,
    },
    brand: {
      "@type": "Brand",
      name: "Isisel",
    },
    ...(hasOffer
      ? {
          offers: {
            "@type": "Offer",
            price: offerPrice,
            priceCurrency: "USD",
            url: canonicalUrl,
            availability: publicStay
              ? "https://schema.org/InStock"
              : "https://schema.org/SoldOut",
          },
        }
      : {}),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Properties",
        item: `${siteUrl}/properties`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: property.location?.city || "City",
        item: `${siteUrl}/properties?location=${encodeURIComponent(property.location?.city || "")}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: property.name,
        item: canonicalUrl,
      },
    ],
  };

  // ONLY renders invisible SEO scripts — no visible UI
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}
