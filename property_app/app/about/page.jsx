import AboutLanding from "@/components/about/AboutLanding";
import { aboutPage, aboutSeo } from "./content";

export const metadata = {
  title: { absolute: aboutSeo.title },
  description: aboutSeo.description,
  alternates: { canonical: aboutSeo.canonical },
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
    url: "/about",
    siteName: "Isisel",
    title: aboutSeo.ogTitle,
    description: aboutSeo.ogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: aboutSeo.ogTitle,
    description: aboutSeo.ogDescription,
  },
};

export default function AboutPage() {
  return <AboutLanding seo={aboutSeo} page={aboutPage} />;
}
