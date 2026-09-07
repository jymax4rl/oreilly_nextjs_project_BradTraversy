import connectToDatabase from "@/config/database";
import FoundingHostsLanding from "@/components/foundingHosts/FoundingHostsLanding";
import { getOrCreateProgramSettings } from "@/utils/foundingHost/settings";
import { serializeProgramPublicStats } from "@/utils/foundingHost/serialize";
import { PROGRAM_DEFAULTS } from "@/utils/foundingHost/logic";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Founding 100 Hosts | Isisel",
  description:
    "Become one of Isisel’s Founding Hosts — 0% platform commission for a founding term, and permanent recognition as we build property stays across Africa.",
  alternates: { canonical: "/founding-hosts" },
  openGraph: {
    type: "website",
    url: "/founding-hosts",
    siteName: "Isisel",
    title: "Become One of Isisel’s Founding Hosts",
    description:
      "We’re building the future of property stays in Africa — and we want our first hosts to build it with us.",
  },
};

export default async function FoundingHostsPage() {
  let stats = serializeProgramPublicStats({
    ...PROGRAM_DEFAULTS,
    claimedCount: 0,
  });

  try {
    const ok = await connectToDatabase();
    if (ok) {
      const settings = await getOrCreateProgramSettings();
      stats = serializeProgramPublicStats(settings);
    }
  } catch (error) {
    console.error("founding-hosts page stats:", error);
  }

  return <FoundingHostsLanding stats={stats} />;
}
