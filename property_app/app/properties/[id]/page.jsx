import connectToDatabase from "@/config/database";
import { propertyImageAbsoluteUrl } from "@/utils/propertyImageUrl";
import Property from "@/models/Property";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import ServerProperty from "@/components/dynamicComponents/ServerProperty";
import DynamicProperty from "@/components/dynamicComponents/DynamicProperty";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await Property.findById(id).lean();

  if (!property) {
    return { title: "Property Not Found | Kama Properties" };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com";
  const canonicalUrl = `${siteUrl}/properties/${id}`;
  const ogImage = propertyImageAbsoluteUrl(
    property.images?.[0],
    siteUrl,
  );

  return {
    title: `${property.name} | ${property.location?.city || "Africa"}`,
    description:
      property.description?.slice(0, 160) ||
      `Stay at ${property.name} in ${property.location?.city}`,
    keywords: `${property.type}, ${property.location?.city}, ${property.location?.country}, vacation rental, Africa`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: property.name,
      description: property.description?.slice(0, 160),
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${property.name} in ${property.location?.city}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: property.name,
      description: property.description?.slice(0, 160),
      images: [ogImage],
    },
  };
}

export default async function PropertyPage({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await Property.findById(id, "-internalNotes").lean();

  if (!property) {
    notFound();
  }

  const serialized = serializePropertyForClient(property);

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/properties/${id}`;

  return (
    <div className="overflow-x-hidden">
      <ServerProperty property={serialized} canonicalUrl={canonicalUrl} />
      <DynamicProperty property={serialized} />
    </div>
  );
}
export const revalidate = 3600; // Regenerate every 1 hour
