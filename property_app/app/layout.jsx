import "@/assets/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterGate from "@/components/FooterGate";
import MainShell from "@/components/MainShell";
import MobileBottomNavGate from "@/components/MobileBottomNavGate";
import MobileTopChromeGate from "@/components/MobileTopChromeGate";
import React from "react";
import StyledComponentsRegistry from "@/lib/registry";
import { CurrencyProvider } from "@/utils/CurrencyContext";
import AuthProvider from "@/components/AuthProvider";
import { MenuOverlayProvider } from "@/contexts/MenuOverlayContext";
import { ScrollNavProvider } from "@/contexts/ScrollNavContext";
import ChunkErrorRecovery from "@/components/ChunkErrorRecovery";
import TrafficProbe from "@/components/metrics/TrafficProbe";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { getRequestLang } from "@/lib/i18n/server";
import SiteJsonLd from "@/components/seo/SiteJsonLd";
import {
  BRAND_NAME,
  BRAND_TITLE_DEFAULT,
  BRAND_TITLE_TEMPLATE,
} from "@/utils/brand";

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com",
  ),
  title: {
    default: BRAND_TITLE_DEFAULT,
    template: BRAND_TITLE_TEMPLATE,
  },
  description:
    "Book African vacation rentals — villas and apartments in Dakar, Accra, Cape Town, Cairo, Marrakech, and Zanzibar.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: BRAND_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_TITLE_DEFAULT,
    description:
      "Book African vacation rentals — villas and apartments in Dakar, Accra, Cape Town, Cairo, Marrakech, and Zanzibar.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

async function MainLayout({ children }) {
  const lang = await getRequestLang();

  return (
    <AuthProvider>
      <MenuOverlayProvider>
        <ScrollNavProvider>
          <CurrencyProvider>
            <LanguageProvider initialLang={lang}>
              <StyledComponentsRegistry>
                <html lang={lang}>
                  <body className="flex flex-col min-h-screen">
                    <SiteJsonLd />
                    <ChunkErrorRecovery />
                    <TrafficProbe />
                    <Navbar />
                    <MobileTopChromeGate />
                    <MainShell>{children}</MainShell>
                    <MobileBottomNavGate />
                    <FooterGate>
                      <Footer className="hidden lg:block" />
                    </FooterGate>
                  </body>
                </html>
              </StyledComponentsRegistry>
            </LanguageProvider>
          </CurrencyProvider>
        </ScrollNavProvider>
      </MenuOverlayProvider>
    </AuthProvider>
  );
}

export default MainLayout;
