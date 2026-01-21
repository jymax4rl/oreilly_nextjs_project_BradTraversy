import React from "react";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import DynamicProperty from "@/components/dynamicComponents/DynamicProperty";
import ServerProperty from "@/components/dynamicComponents/ServerProperty";
import { notFound } from "next/navigation";

/* ============================
   SEO METADATA (SERVER-SIDE)
============================ */

function stripHtml(html = "") {
  return String(html).replace(/<\/[^>]+(>|$)/g, "");
}
function truncate(str = "", max = 160) {
  if (!str) return "";
  return str.length <= max ? str : str.slice(0, max - 3).trim() + "...";
}

export async function generateMetadata({ params }) {
  const id = params?.id;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com").replace(/\/$/, "");

  await connectToDatabase();
  // Project only the public fields needed for metadata
  const property = await Property.findById(id, "name description images location type").lean();

  if (!property) {
    return {
      title: "Property not found | Aplica",
      description: "This property does not exist",
      robots: { index: false, follow: true },
    };
  }

  const rawDesc = stripHtml(property.description || "");
  const description = truncate(rawDesc, 160);

  const canonicalUrl = `${siteUrl}/properties/${property._id || id}`;
  const firstImage = property.images?.length ? property.images[0] : null;
  const absoluteImage = firstImage
    ? (firstImage.startsWith("http") ? firstImage : `${siteUrl}${firstImage}`)
    : `${siteUrl}/og-default.jpg`;

  return {
    title: `${property.name} | ${property.type} ${property.location?.city || ""} | Aplica`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      url: canonicalUrl,
      title: property.name,
      description,
      type: "website",
      images: [
        {
          url: absoluteImage,
          alt: property.name || "Property image",
        },
      ],
    },
    twitter: {
      card: firstImage ? "summary_large_image" : "summary",
      title: property.name,
      description,
      images: [absoluteImage],
    },
  };
}

/* ============================
   PAGE SERVER COMPONENT
============================ */

export default async function PropertyPage({ params }) {
  // Next.js app router provides params
  const { id } = params;

  await connectToDatabase();

  // Project only the fields required for rendering + JSON-LD
  const propertyDoc = await Property.findById(id, "-internalNotes -sensitiveField").lean();

  if (!propertyDoc) {
    // Return a 404 page (HTTP 404) so search engines don't index a Not Found UI
    notFound();
  }

  // Convert ObjectId to string for serialization
  const property = {
    ...propertyDoc,
    _id: propertyDoc._id.toString(),
  };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com").replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/properties/${property._id}`;

  // Render server-side header/JSON-LD via ServerProperty (server component),
  // and client interactive content via DynamicProperty
  return (
    <div className="pt-[8vh]">
      <ServerProperty property={property} canonicalUrl={canonicalUrl} />
      <DynamicProperty property={property} />
    </div>
  );
}