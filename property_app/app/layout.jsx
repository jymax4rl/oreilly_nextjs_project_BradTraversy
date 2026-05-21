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

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://kamaproperties.com",
  ),
  title: {
    default: "Kama Properties | African Vacation Rentals",
    template: "%s | Kama Properties",
  },
  description: "Kama Properties made for Africans by Africans...",
  keywords: "Rent in Senegal, Rent in Mali, Rent in Ghana...",
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

function MainLayout({ children }) {
  return (
    <AuthProvider>
      <MenuOverlayProvider>
        <ScrollNavProvider>
          <CurrencyProvider>
            <StyledComponentsRegistry>
              <html lang="en">
                <body className="flex flex-col min-h-screen">
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
          </CurrencyProvider>
        </ScrollNavProvider>
      </MenuOverlayProvider>
    </AuthProvider>
  );
}

export default MainLayout;
