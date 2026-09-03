import CreatorLanding from "@/components/creators/CreatorLanding";
import { creatorPage, creatorSeo } from "./content";

export const metadata = {
  title: { absolute: creatorSeo.title },
  description: creatorSeo.description,
  alternates: { canonical: creatorSeo.canonical },
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
    url: "/influencers",
    siteName: "Isisel",
    title: creatorSeo.ogTitle,
    description: creatorSeo.ogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: creatorSeo.ogTitle,
    description: creatorSeo.ogDescription,
  },
};

export default function InfluencersPage() {
  return <CreatorLanding seo={creatorSeo} page={creatorPage} />;
}
