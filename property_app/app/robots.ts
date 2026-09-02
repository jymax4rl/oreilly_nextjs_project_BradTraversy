import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/business", "/properties", "/host/onboarding"],
      disallow: [
        "/api/",
        "/admin/",
        "/ops/",
        "/login",
        "/messages",
        "/profile",
        "/settings",
        "/my-bookings",
        "/saved-properties",
        "/bookings",
        "/host/",
        "/properties/add",
        "/properties/my-listings",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
