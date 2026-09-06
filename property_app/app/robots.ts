import { MetadataRoute } from "next";
import { isListingsCatalogBeta } from "@/utils/listings/catalogBeta";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com";
  const beta = isListingsCatalogBeta();

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/about",
        "/contact",
        "/business",
        "/founding-hosts",
        "/influencers",
        "/investors",
        "/properties",
        "/host/onboarding",
      ],
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
        ...(beta ? ["/properties/"] : []),
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
