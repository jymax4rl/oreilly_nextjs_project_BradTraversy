import React from "react";
import Image from "next/image";

/**
 * Server-rendered component containing SEO-critical DOM:
 * - H1 title
 * - short description snippet
 * - location / address
 * - main hero image (server-rendered <img> via next/image)
 * - JSON-LD for RealEstateListing, Offer, BreadcrumbList
 *
 * This component must be a server component (no "use client").
 */

export default function ServerProperty({ property, canonicalUrl }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com").replace(/\/$/, "");
  const mainImagePath = property.images?.[0] || "/properties/default.jpg";
  const mainImage = mainImagePath.startsWith("http") ? mainImagePath : `${siteUrl}${mainImagePath}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.name,
    "description": property.description,
    "url": canonicalUrl,
    "image": [mainImage],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.location?.street || "",
      "addressLocality": property.location?.city || "",
      "addressCountry": property.location?.country || ""
    },
    "offers": {
      "@type": "Offer",
      "price": property.rates?.monthly || property.rates?.weekly || property.rates?.nightly || 0,
      "priceCurrency": "USD"
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

      {/* JSON-LD structured data */}
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
