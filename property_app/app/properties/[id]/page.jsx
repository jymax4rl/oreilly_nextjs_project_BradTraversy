import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import ServerProperty from "@/components/dynamicComponents/ServerProperty";
import DynamicProperty from "@/components/dynamicComponents/DynamicProperty";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  canUserViewListing,
  isPubliclyVisibleListing,
  isAwaitingListingModeration,
} from "@/utils/listingApproval";
import { serializePropertyForClient } from "@/utils/serializePropertyClient";

export async function generateMetadata({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await Property.findById(id).lean();

  if (!property) {
    return { title: "Property Not Found | Kama Properties" };
  }

  const session = await getServerSession(authOptions);
  if (
    !canUserViewListing(
      { ...property, owner: property.owner?.toString?.() || property.owner },
      session,
    )
  ) {
    return {
      title: "Listing | Kama Properties",
      robots: { index: false, follow: false },
    };
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
  const { id } = await params; // ← await for Next.js 15+
  const property = await Property.findById(id, "-internalNotes").lean();

  if (!property) {
    notFound();
  }

  const session = await getServerSession(authOptions);

  const rawForAuth = {
    ...property,
    _id: property._id.toString(),
    owner: property.owner?.toString?.() || property.owner,
  };

  if (!canUserViewListing(rawForAuth, session)) {
    notFound();
  }

  const serialized = serializePropertyForClient(property);

  const showReviewUi =
    session?.user &&
    (isAwaitingListingModeration(serialized) ||
      serialized.listingStatus === "rejected") &&
    (session.user.role === "admin" ||
      String(serialized.owner) === String(session.user.id));

  const listingReviewInfo = showReviewUi
    ? {
        status: serialized.listingStatus,
        reason: serialized.listingRejectionReason,
      }
    : null;

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/properties/${id}`;

  return (
    <div className="pt-[10vh]">
      {" "}
      {/* ← clears fixed navbar */}
      <ServerProperty
        property={serialized}
        canonicalUrl={canonicalUrl}
        includeJsonLd={isPubliclyVisibleListing(serialized)}
      />
      <DynamicProperty
        property={serialized}
        listingReviewInfo={listingReviewInfo}
        canAdminModerate={
          session?.user?.role === "admin" &&
          (isAwaitingListingModeration(serialized) ||
            serialized.listingStatus === "rejected")
        }
      />
    </div>
  );
}
export const revalidate = 3600; // Regenerate every 1 hour
