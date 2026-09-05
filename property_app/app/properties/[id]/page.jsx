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
  canBrowseListingCatalog,
  isListingsCatalogBeta,
} from "@/utils/listings/catalogBeta";
import {
  ensurePropertySlug,
  findPropertyByParam,
} from "@/utils/listings/propertySlug";
import { propertyPublicPath, propertyPublicUrl } from "@/utils/listings/propertyPath";
import {
  listingTitleSegment,
  listingMetaDescription,
  listingKeywords,
} from "@/utils/seo/listingMetadata";
import {
  canUnlockPreviewListing,
  isListingOwner,
} from "@/utils/listings/previewLockedHost";
import { isListingPreviewLocked } from "@/utils/listings/previewLockedHost.server";
import { findSameOwnerPublicListings } from "@/utils/listings/sameOwnerListings";

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
      title: { absolute: "Property Not Found | Isisel" },
      robots: { index: false, follow: false },
    };
  }

  const session = await getServerSession(authOptions);
  if (!canUserViewListing(property, session)) {
    return {
      title: { absolute: "Property Not Found | Isisel" },
      robots: { index: false, follow: false },
    };
  }
  if (
    (await isListingPreviewLocked(property)) &&
    !canUnlockPreviewListing(session) &&
    !isListingOwner(session, property)
  ) {
    return {
      title: { absolute: "Property Not Found | Isisel" },
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = propertyPublicUrl(property);
  const ogImage = propertyImageAbsoluteUrl(
    property.images?.[0],
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com",
  );
  const title = listingTitleSegment(property);
  const description = listingMetaDescription(property);
  const place = [
    property.location?.city,
    property.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    title,
    description,
    keywords: listingKeywords(property),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | Isisel`,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Isisel",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${property.name} vacation rental in ${place || "Africa"}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Isisel`,
      description,
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
    if (isListingsCatalogBeta() && !canBrowseListingCatalog(session)) {
      redirect("/properties");
    }
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

  const siblingListings = await findSameOwnerPublicListings(property);

  return (
    <div className="overflow-x-hidden">
      <ServerProperty
        property={serialized}
        canonicalUrl={propertyPublicUrl(property)}
      />
      <DynamicProperty
        property={serialized}
        siblingListings={siblingListings}
      />
    </div>
  );
}
export const dynamic = "force-dynamic";
