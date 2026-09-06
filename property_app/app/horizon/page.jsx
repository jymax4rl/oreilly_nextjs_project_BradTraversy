import HorizonLanding from "@/components/horizon/HorizonLanding";
import { horizonPage, horizonSeo } from "./content";

const pageUrl = horizonSeo.pageUrl();
const ogImage = horizonSeo.absoluteOgImage();

export const metadata = {
  title: { absolute: horizonSeo.title },
  description: horizonSeo.description,
  keywords: horizonSeo.keywords,
  alternates: { canonical: pageUrl },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: pageUrl,
    siteName: "Isisel",
    title: horizonSeo.ogTitle,
    description: horizonSeo.ogDescription,
    images: [
      {
        url: ogImage,
        width: horizonSeo.ogImageWidth,
        height: horizonSeo.ogImageHeight,
        alt: "Horizon by Swami India — sea-view apartments in Bijilo, The Gambia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: horizonSeo.ogTitle,
    description: horizonSeo.ogDescription,
    images: [ogImage],
  },
  category: "real estate",
};

export default function HorizonPage() {
  return <HorizonLanding seo={horizonSeo} page={horizonPage} />;
}
