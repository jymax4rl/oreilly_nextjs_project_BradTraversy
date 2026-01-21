// property_app/components/dynamicComponents/ServerProperty.jsx
import React from "react";
import Image from "next/image";

function stripHtml(html = "") {
  return String(html).replace(/<\/?[^>]+(>|$)/g, "");
}
function truncate(str = "", max = 160) {
  if (!str) return "";
  return str.length <= max ? str : str.slice(0, max - 3).trim() + "...";
}

/**
 * Map a property's country (name or code) to a likely currency code.
 * Extend this mapping as needed for your target markets.
 */
function getCurrencyForCountry(country = "") {
  if (!country) return "USD";
  const c = country.toLowerCase();
  if (c.includes("united states") || c === "us" || c === "usa") return "USD";
  if (c.includes("united kingdom") || c === "uk" || c === "gb") return "GBP";
  if (c.includes("canada") || c === "ca") return "CAD";
  if (c.includes("south africa") || c === "za") return "ZAR";
  if (c.includes("nigeria") || c === "ng") return "NGN";
  if (c.includes("kenya") || c === "ke") return "KES";
  if (c.includes("morocco") || c === "ma") return "MAD";
  if (c.includes("ghana") || c === "gh") return "GHS";
  if (c.includes("france") || c === "fr") return "EUR"; // assume EUR for many europe countries — adjust as needed
  if (c.includes("europe") || c.includes("eur")) return "EUR";
  // add more mappings as necessary
  return "USD";
}

export default function ServerProperty({ property, canonicalUrl }) {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com"
  ).replace(/\/$/, "");
  const imagePath = property.images?.[0];
  const mainImagePath = imagePath
    ? imagePath.startsWith("http") || imagePath.startsWith("/")
      ? imagePath
      : /^\d+_/.test(imagePath)
        ? `/images/properties/${imagePath}`
        : `/properties/${imagePath}`
    : "/properties/default.jpg";

  const mainImage = mainImagePath.startsWith("http")
    ? mainImagePath
    : `${siteUrl}${mainImagePath}`;

  // Short sanitized description for server HTML & JSON-LD
  const raw = stripHtml(property.description || "");
  const shortDescription = truncate(raw, 150);

  // Determine numeric price (prefer monthly -> weekly -> nightly)
  const price =
    (property.rates &&
      (property.rates.monthly ||
        property.rates.weekly ||
        property.rates.nightly)) ||
    0;

  // Determine currency from country (DB lacks property.currency)
  const priceCurrency = getCurrencyForCountry(property.location?.country);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.name,
    description: shortDescription,
    url: canonicalUrl,
    image: [mainImage],
    address: {
      "@type": "PostalAddress",
      streetAddress: property.location?.street || "",
      addressLocality: property.location?.city || "",
      addressRegion: property.location?.region || "",
      addressCountry: property.location?.country || "",
    },
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: priceCurrency,
      url: canonicalUrl,
      availability: property.available
        ? "https://schema.org/InStock"
        : "https://schema.org/Unavailable",
    },
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
        item: `${siteUrl}/properties?city=${encodeURIComponent(property.location?.city || "")}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: property.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <header className="max-w-7xl mx-auto px-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-thin tracking-tight text-slate-900">
            {property.name}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>
              {property.location?.street}, {property.location?.city},{" "}
              {property.location?.country}
            </span>
          </div>

          {/* Server-rendered short description for improved snippet & indexing */}
          {shortDescription && (
            <p className="mt-3 text-lg text-slate-700 max-w-3xl">
              {shortDescription}
            </p>
          )}
        </div>

        <div className="mt-8 relative h-[420px] md:h-[500px] rounded-2xl overflow-hidden">
          <Image
            src={mainImagePath}
            alt={`${property.name} — main view`}
            fill
            priority
            quality={90}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
            className="object-cover"
          />
        </div>
      </header>

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
