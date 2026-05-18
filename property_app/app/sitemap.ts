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

  // Dynamic property pages — only approved listings
  await connectToDatabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties = await (Property as any)
    .find({ status: "approved" })
    .select("_id updatedAt")
    .lean() as Array<{ _id: { toString(): string }; updatedAt?: Date }>;

  const propertyRoutes = properties.map((property) => ({
    url: `${baseUrl}/properties/${property._id.toString()}`,
    lastModified: property.updatedAt
      ? new Date(property.updatedAt)
      : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...propertyRoutes];
}
