import React from "react";

function stripHtml(html = "") {
  return String(html).replace(/<\/?[^>]+(>|$)/g, "");
}
function truncate(str = "", max = 160) {
  if (!str) return "";
  return str.length <= max ? str : str.slice(0, max - 3).trim() + "...";
}

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
  if (c.includes("france") || c === "fr") return "EUR";
  if (c.includes("europe") || c.includes("eur")) return "EUR";
  return "USD";
}

export default function ServerProperty({ property, canonicalUrl }) {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com"
  ).replace(/\/$/, "");

  const rawImagePath = property.images?.[0] || "/properties/default.jpg";
  const localImagePath = rawImagePath.startsWith("/")
    ? rawImagePath
    : `/images/properties/${rawImagePath}`;
  const absoluteImageUrl = rawImagePath.startsWith("http")
    ? rawImagePath
    : `${siteUrl}${localImagePath}`;

  const raw = stripHtml(property.description || "");
  const shortDescription = truncate(raw, 150);
  const price =
    (property.rates &&
      (property.rates.monthly ||
        property.rates.weekly ||
        property.rates.nightly)) ||
    0;
  const priceCurrency = getCurrencyForCountry(property.location?.country);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.name,
    description: shortDescription,
    url: canonicalUrl,
    image: [absoluteImageUrl],
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
