import { BRAND_EMAIL, BRAND_NAME, BRAND_SITE_URL } from "@/utils/brand";

export default function SiteJsonLd() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || BRAND_SITE_URL
  ).replace(/\/$/, "");

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: BRAND_NAME,
        legalName: BRAND_NAME,
        alternateName: ["isisel.com"],
        url: siteUrl,
        email: BRAND_EMAIL,
        description:
          "African vacation rentals marketplace for villas and apartments across Senegal, Ghana, Egypt, Morocco, South Africa, and Tanzania.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: BRAND_NAME,
        alternateName: "isisel.com",
        url: siteUrl,
        inLanguage: ["en", "fr"],
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/properties?location={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
