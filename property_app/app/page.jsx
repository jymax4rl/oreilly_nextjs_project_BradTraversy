import React from "react";
import HomeImmersive from "@/components/home/HomeImmersive";
import HomeStaysHeading from "@/components/home/HomeStaysHeading";
import PropertiesPage from "./properties/page";

export const metadata = {
  title: { absolute: "Isisel | African Vacation Rentals" },
  description:
    "Book African vacation rentals on Isisel — villas and apartments in Dakar, Accra, Cape Town, Cairo, Marrakech, and Zanzibar.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Isisel",
    title: "Isisel | African Vacation Rentals",
    description:
      "Book African vacation rentals on Isisel — villas and apartments in Dakar, Accra, Cape Town, Cairo, Marrakech, and Zanzibar.",
  },
};

// Home embeds live listings; keep dynamic so Docker builds need no MONGODB_URI.
export const dynamic = "force-dynamic";

const HomePage = () => {
  return (
    <HomeImmersive>
      <div id="stays" className="home-listings-bridge relative z-[2]">
        <HomeStaysHeading />
        <PropertiesPage hideSearchToolbar maxProperties={11} />
      </div>
    </HomeImmersive>
  );
};

export default HomePage;
