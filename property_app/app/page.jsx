import React from "react";
import HomeImmersive from "@/components/home/HomeImmersive";
import ComingSoonStays from "@/components/home/ComingSoonStays";
import connectToDatabase from "@/config/database";
import { getOrCreateProgramSettings } from "@/utils/foundingHost/settings";
import { serializeProgramPublicStats } from "@/utils/foundingHost/serialize";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  canBrowseListingCatalog,
  isListingsCatalogBeta,
} from "@/utils/listings/catalogBeta";
import { fetchHomeSeedProperties } from "@/utils/listings/homeSeedProperties";

const beta = isListingsCatalogBeta();

export const metadata = {
  title: { absolute: "Isisel | African Vacation Rentals" },
  description: beta
    ? "African vacation rentals, opening soon. Hosts are already listing with Isisel — guests will browse when the catalogue opens."
    : "Book African vacation rentals on Isisel — villas and apartments in Dakar, Accra, Cape Town, Cairo, Marrakech, and Zanzibar.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Isisel",
    title: "Isisel | African Vacation Rentals",
    description: beta
      ? "African vacation rentals, opening soon. Hosts are already listing with Isisel."
      : "Book African vacation rentals on Isisel — villas and apartments in Dakar, Accra, Cape Town, Cairo, Marrakech, and Zanzibar.",
  },
};

export const dynamic = "force-dynamic";

const HomePage = async () => {
  const session = await getServerSession(authOptions);
  const catalogOpen = canBrowseListingCatalog(session);

  let foundingStats = null;
  let seedProperties = [];
  try {
    const ok = await connectToDatabase();
    if (ok) {
      const settings = await getOrCreateProgramSettings();
      foundingStats = serializeProgramPublicStats(settings);
    }
  } catch (error) {
    console.error("home founding stats:", error);
  }

  // Cold-open Discover list uses seedProperties before expand/search pins load.
  if (catalogOpen) {
    seedProperties = await fetchHomeSeedProperties({ limit: 80 });
  }

  return (
    <HomeImmersive
      foundingStats={foundingStats}
      catalogOpen={catalogOpen}
      seedProperties={seedProperties}
    >
      {!catalogOpen ? (
        <div id="stays" className="home-listings-bridge relative z-[2]">
          <ComingSoonStays variant="home" />
        </div>
      ) : null}
    </HomeImmersive>
  );
};

export default HomePage;
