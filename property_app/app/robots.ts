import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kamaproperties.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/host/",
        "/bookings",
        "/saved-properties",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
