import connectToDatabase from "@/config/database";
import { propertyImageAbsoluteUrl } from "@/utils/propertyImageUrl";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import { attachOwnerProfiles } from "@/utils/user/attachOwnerProfiles";
import ServerProperty from "@/components/dynamicComponents/ServerProperty";
import DynamicProperty from "@/components/dynamicComponents/DynamicProperty";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { canUserViewListing } from "@/utils/listingApproval";
import {
  ensurePropertySlug,
  findPropertyByParam,
} from "@/utils/listings/propertySlug";
import { propertyPublicPath, propertyPublicUrl } from "@/utils/listings/propertyPath";
import {
  canUnlockPreviewListing,
  isListingOwner,
} from "@/utils/listings/previewLockedHost";
import { isListingPreviewLocked } from "@/utils/listings/previewLockedHost.server";

async function loadPublicListing(param) {
  await connectToDatabase();
  const found = await findPropertyByParam(param, "-internalNotes");
  if (!found) return null;
  return ensurePropertySlug(found);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const property = await loadPublicListing(id);

  if (!property) {
    return {
      title: "Property Not Found | Kama Properties",
      robots: { index: false, follow: false },
    };
  }

  const session = await getServerSession(authOptions);
  if (!canUserViewListing(property, session)) {
    return {
      title: "Property Not Found | Kama Properties",
      robots: { index: false, follow: false },
    };
  }
  if (
    (await isListingPreviewLocked(property)) &&
    !canUnlockPreviewListing(session) &&
    !isListingOwner(session, property)
  ) {
    return {
      title: "Property Not Found | Kama Properties",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = propertyPublicUrl(property);
  const ogImage = propertyImageAbsoluteUrl(
    property.images?.[0],
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com",
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
  const { id } = await params;
  const property = await loadPublicListing(id);

  if (!property) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (!canUserViewListing(property, session)) {
    notFound();
  }
  const serialized = await attachOwnerProfiles(
    serializePropertyForClient(property),
  );
  if (
    serialized.previewLocked &&
    !canUnlockPreviewListing(session) &&
    !isListingOwner(session, serialized)
  ) {
    redirect("/properties");
  }

  const publicPath = propertyPublicPath(property);
  if (property.slug && id !== property.slug) {
    permanentRedirect(publicPath);
  }

  return (
    <div className="overflow-x-hidden">
      <ServerProperty
        property={serialized}
        canonicalUrl={propertyPublicUrl(property)}
      />
      <DynamicProperty property={serialized} />
    </div>
  );
}
export const dynamic = "force-dynamic";
