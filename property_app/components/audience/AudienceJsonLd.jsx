import { siteUrl } from "@/utils/audience/paths";

export default function AudienceJsonLd({
  path,
  title,
  description,
  breadcrumb = [],
  faq = [],
}) {
  const pageUrl = siteUrl(path);
  const site = siteUrl("/");

  const graph = [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description,
      inLanguage: "en",
      isPartOf: { "@id": `${site}/#website` },
      about: { "@id": `${site}/#organization` },
      publisher: { "@id": `${site}/#organization` },
      breadcrumb: breadcrumb.length
        ? { "@id": `${pageUrl}#breadcrumb` }
        : undefined,
    },
  ];

  if (breadcrumb.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: breadcrumb.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.label,
        item: siteUrl(item.href),
      })),
    });
  }

  if (faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      url: `${pageUrl}#faq`,
      isPartOf: { "@id": `${pageUrl}#webpage` },
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph.filter(Boolean),
        }),
      }}
    />
  );
}
