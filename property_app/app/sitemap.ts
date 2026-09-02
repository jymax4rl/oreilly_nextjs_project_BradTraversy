import { MetadataRoute } from "next";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { approvedListingQuery } from "@/utils/listingApproval";
import { ensurePropertySlug } from "@/utils/listings/propertySlug";
import { propertyPublicPath } from "@/utils/listings/propertyPath";
import { SECTION_IDS } from "@/lib/legal/content";
import { findPreviewLockedOwnerIds } from "@/utils/listings/previewLockedHost.server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com";

  // Static pages
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/business`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/host/onboarding`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policies`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    ...SECTION_IDS.map((section) => ({
      url: `${baseUrl}/policies/${section}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];

  // Dynamic property pages — only when database is available at build/runtime
  let propertyRoutes: MetadataRoute.Sitemap = [];
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      const properties = (await (Property as any)
        .find(approvedListingQuery())
        .select("_id updatedAt slug name location owner")
        .lean()) as Array<{
        _id: { toString(): string };
        updatedAt?: Date;
        slug?: string;
        name?: string;
        location?: { city?: string; country?: string };
        owner?: { toString(): string } | string;
      }>;

      const lockedOwners = new Set(await findPreviewLockedOwnerIds());

      propertyRoutes = [];
      for (const property of properties) {
        const ownerId =
          property.owner != null ? String(property.owner) : "";
        if (ownerId && lockedOwners.has(ownerId)) continue;
        const withSlug = await ensurePropertySlug(property);
        propertyRoutes.push({
          url: `${baseUrl}${propertyPublicPath(withSlug)}`,
          lastModified: property.updatedAt
            ? new Date(property.updatedAt)
            : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        });
      }
    } catch (error) {
      console.error("sitemap: failed to load properties", error);
    }
  }

  return [...staticRoutes, ...propertyRoutes];
}
