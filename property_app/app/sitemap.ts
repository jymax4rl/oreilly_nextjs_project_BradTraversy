import { MetadataRoute } from "next";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";

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
      url: `${baseUrl}/host/onboarding`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  // Dynamic property pages — only when database is available at build/runtime
  let propertyRoutes: MetadataRoute.Sitemap = [];
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      const properties = (await (Property as any)
        .find({ status: "approved" })
        .select("_id updatedAt")
        .lean()) as Array<{ _id: { toString(): string }; updatedAt?: Date }>;

      propertyRoutes = properties.map((property) => ({
        url: `${baseUrl}/properties/${property._id.toString()}`,
        lastModified: property.updatedAt
          ? new Date(property.updatedAt)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    } catch (error) {
      console.error("sitemap: failed to load properties", error);
    }
  }

  return [...staticRoutes, ...propertyRoutes];
}
