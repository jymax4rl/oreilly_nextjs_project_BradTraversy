import InvestorLanding from "@/components/investors/InvestorLanding";
import { investorPage, investorSeo } from "./content";

export const metadata = {
  title: { absolute: investorSeo.title },
  description: investorSeo.description,
  alternates: { canonical: investorSeo.canonical },
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
    url: "/investors",
    siteName: "Isisel",
    title: investorSeo.ogTitle,
    description: investorSeo.ogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: investorSeo.ogTitle,
    description: investorSeo.ogDescription,
  },
};

export default function InvestorsPage() {
  return <InvestorLanding seo={investorSeo} page={investorPage} />;
}
