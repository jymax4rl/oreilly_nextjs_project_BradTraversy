import { MetadataRoute } from "next";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { approvedListingQuery } from "@/utils/listingApproval";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kamaproperties.com";

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
      url: `${baseUrl}/host/onboarding`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  // Dynamic property pages (best-effort; don't fail build if DB is unavailable)
  let propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    await connectToDatabase();
    const properties = await (Property as any)
      .find(approvedListingQuery(), "_id updatedAt")
      .lean();

    propertyRoutes = properties.map((property: any) => ({
      url: `${baseUrl}/properties/${property._id.toString()}`,
      lastModified: property.updatedAt
        ? new Date(property.updatedAt)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Sitemap dynamic route generation skipped:", error);
  }

  return [...staticRoutes, ...propertyRoutes];
}
