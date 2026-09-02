import AudienceLanding from "@/components/audience/AudienceLanding";
import { businessPage, businessSeo } from "./content";

export const metadata = {
  title: { absolute: businessSeo.title },
  description: businessSeo.description,
  alternates: { canonical: businessSeo.canonical },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/business",
    siteName: "Isisel",
    title: businessSeo.ogTitle,
    description: businessSeo.ogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: businessSeo.ogTitle,
    description: businessSeo.ogDescription,
  },
};

export default function BusinessPage() {
  return <AudienceLanding seo={businessSeo} page={businessPage} />;
}
