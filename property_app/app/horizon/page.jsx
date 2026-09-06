import HorizonLanding from "@/components/horizon/HorizonLanding";
import { horizonPage, horizonSeo } from "./content";

export const metadata = {
  title: { absolute: horizonSeo.title },
  description: horizonSeo.description,
  alternates: { canonical: horizonSeo.canonical },
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
    url: "/horizon",
    siteName: "Isisel",
    title: horizonSeo.ogTitle,
    description: horizonSeo.ogDescription,
    images: [
      {
        url: "/horizon/hero-exterior.jpg",
        width: 2160,
        height: 1214,
        alt: "Horizon by Swami India in Bijilo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: horizonSeo.ogTitle,
    description: horizonSeo.ogDescription,
    images: ["/horizon/hero-exterior.jpg"],
  },
};

export default function HorizonPage() {
  return <HorizonLanding seo={horizonSeo} page={horizonPage} />;
}
