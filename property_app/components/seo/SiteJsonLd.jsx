export default function SiteJsonLd() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com"
  ).replace(/\/$/, "");

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Kama Properties",
        legalName: "Kama Properties",
        alternateName: ["Kama", "isisel.com"],
        url: siteUrl,
        description:
          "African vacation rentals marketplace for villas and apartments across Senegal, Ghana, Egypt, Morocco, South Africa, and Tanzania.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Kama Properties",
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
