// key changes:
// - show a server-rendered short description under the H1
// - JSON-LD uses truncated sanitized description and dynamic priceCurrency
// - JSON-LD includes image array and offers.price/priceCurrency

import React from "react";
import Image from "next/image";

function stripHtml(html = "") {
  return String(html).replace(/<\/?[^>]+(>|$)/g, "");
}
function truncate(str = "", max = 160) {
  if (!str) return "";
  return str.length <= max ? str : str.slice(0, max - 3).trim() + "...";
}

export default function ServerProperty({ property, canonicalUrl }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com").replace(/\/$/, "");
  const mainImagePath = property.images?.[0] || "/properties/default.jpg";
  const mainImage = mainImagePath.startsWith("http") ? mainImagePath : `${siteUrl}${mainImagePath}`;

  // SAFETY: short sanitized description for page HTML & JSON-LD
  const raw = stripHtml(property.description || "");
  const shortDescription = truncate(raw, 150);

  // Determine price and currency (fallbacks)
  const price = property.rates?.monthly || property.rates?.weekly || property.rates?.nightly || 0;
  const priceCurrency = property.currency || property.rates?.currency || "USD";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.name,
    "description": shortDescription,
    "url": canonicalUrl,
    "image": [mainImage],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.location?.street || "",
      "addressLocality": property.location?.city || "",
      "addressRegion": property.location?.region || "",
      "addressCountry": property.location?.country || ""
    },
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": priceCurrency,
      "url": canonicalUrl,
      "availability": property.available ? "https://schema.org/InStock" : "https://schema.org/Unavailable"
    }
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Properties", "item": `${siteUrl}/properties` },
      { "@type": "ListItem", "position": 3, "name": property.location?.city || "City", "item": `${siteUrl}/properties?city=${encodeURIComponent(property.location?.city || "")}` },
      { "@type": "ListItem", "position": 4, "name": property.name, "item": canonicalUrl }
    ]
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
              {property.location?.street}, {property.location?.city}, {property.location?.country}
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
            src={mainImage}
            alt={`${property.name} — main view`}
            fill
            priority
            quality={90}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
            className="object-cover"
          />
        </div>
      </header>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </>
  );
}
