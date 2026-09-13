import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import { buildHostCreatorsProgram } from "@/utils/host/creatorsProgram";
import HostCreatorsView from "@/components/host/creators/HostCreatorsView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Creators",
  robots: { index: false, follow: false },
};

export default async function HostCreatorsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(getLoginUrl("/host/creators"));
  }

  if (session.user.hostStatus !== "verified") {
    if (session.user.hostStatus === "onboarding") {
      redirect("/host/pending");
    }
    redirect("/host/onboarding");
  }

  await connectToDatabase();
  const program = await buildHostCreatorsProgram(session.user.id);

  return <HostCreatorsView initial={program} />;
}
