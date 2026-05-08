import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import ServerProperty from "@/components/dynamicComponents/ServerProperty";
import DynamicProperty from "@/components/dynamicComponents/DynamicProperty";
import PropertyContactForm from "@/components/PropertyContactForm";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

export async function generateMetadata({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await Property.findById(id).lean();

  if (!property) {
    return { title: "Property Not Found | Kama Properties" };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kamaproperties.com";
  const canonicalUrl = `${siteUrl}/properties/${id}`;
  const ogImage = property.images?.[0]
    ? `${siteUrl}/images/properties/${property.images[0]}`
    : `${siteUrl}/og-image.jpg`;

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

  const session = await getServerSession(authOptions);

  const serialized = {
    ...property,
    _id: property._id.toString(),
    owner: property.owner?.toString?.() || property.owner,
  };

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/properties/${id}`;

  // Don't show contact form if viewer is the owner
  const isOwner = session?.user?.id === serialized.owner;
  const showContactForm = session && !isOwner && serialized.owner;

  return (
    <div className="pt-[10vh]">
      <ServerProperty property={serialized} canonicalUrl={canonicalUrl} />
      <DynamicProperty property={serialized} />
      {showContactForm && (
        <div className="container mx-auto max-w-3xl px-4 pb-16 mt-8">
          <PropertyContactForm
            propertyId={serialized._id}
            recipientId={serialized.owner}
            propertyName={serialized.name}
          />
        </div>
      )}
    </div>
  );
}
export const revalidate = 3600; // Regenerate every 1 hour
