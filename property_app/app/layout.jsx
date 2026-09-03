import "@/assets/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterGate from "@/components/FooterGate";
import DeployCheckBadge from "@/components/DeployCheckBadge";
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

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.isisel.com",
  ),
  title: {
    default: "Isisel | African Vacation Rentals",
    template: "%s | Isisel",
  },
  description: "Kama Properties made for Africans by Africans...",
  keywords: "Rent in Senegal, Rent in Mali, Rent in Ghana...",
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
    siteName: "Kama Properties",
    images: [
      {
        url: "/og-image.jpg", // Create this 1200x630 image
        width: 1200,
        height: 630,
        alt: "Kama Properties - African Vacation Rentals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kama Properties",
    description: "Kama Properties made for Africans by Africans",
    images: ["/og-image.jpg"],
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

function MainLayout({ children }) {
  return (
    <AuthProvider>
      <MenuOverlayProvider>
        <ScrollNavProvider>
          <CurrencyProvider>
            <StyledComponentsRegistry>
              <html lang="en">
                <body className="flex flex-col min-h-screen">
                  <ChunkErrorRecovery />
                  <PwaRegister />
                  <Navbar />
                  <MobileTopChromeGate />
                  <MainShell>{children}</MainShell>
                  <MobileBottomNavGate />
                  {/* Footer is desktop-only; keep deploy marker visible on mobile too */}
                  <span className="lg:hidden fixed bottom-20 right-3 z-50">
                    <DeployCheckBadge surface="light" />
                  </span>
                  <FooterGate>
                    <Footer className="hidden lg:block" />
                  </FooterGate>
                </body>
              </html>
            </StyledComponentsRegistry>
          </CurrencyProvider>
        </ScrollNavProvider>
      </MenuOverlayProvider>
    </AuthProvider>
  );
}

export default MainLayout;
