import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import {
  buildHostInsights,
  normalizeInsightRange,
} from "@/utils/host/insights";
import HostInsightsView from "@/components/host/insights/HostInsightsView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Insights",
  robots: { index: false, follow: false },
};

export default async function HostInsightsPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(getLoginUrl("/host/insights"));
  }

  if (session.user.hostStatus !== "verified") {
    if (session.user.hostStatus === "onboarding") {
      redirect("/host/pending");
    }
    redirect("/host/onboarding");
  }

  await connectToDatabase();

  const params = await searchParams;
  const days = normalizeInsightRange(params?.range);
  const insights = await buildHostInsights(session.user.id, { days });

  return <HostInsightsView insights={insights} />;
}
