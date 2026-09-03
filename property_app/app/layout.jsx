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
import PwaRegister from "@/components/PwaRegister";
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
  applicationName: "Isisel",
  appleWebApp: {
    capable: true,
    title: "Isisel",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      {
        url: "/apple-touch-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/apple-touch-icon-167x167.png",
        sizes: "167x167",
        type: "image/png",
      },
      {
        url: "/apple-touch-icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        url: "/apple-touch-icon-120x120.png",
        sizes: "120x120",
        type: "image/png",
      },
    ],
    shortcut: [{ url: "/icons/icon-192.png", type: "image/png" }],
  },
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

export const viewport = {
  themeColor: "#1b5c57",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
                    <PwaRegister />
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
