import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import { buildCreatorConsole } from "@/utils/creators/creatorConsole";
import CreatorConsoleView from "@/components/creators/CreatorConsoleView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Creator console | Isisel",
  robots: { index: false, follow: false },
};

export default async function CreatorConsolePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(getLoginUrl("/creators/console"));
  }

  await connectToDatabase();
  const data = await buildCreatorConsole({
    userId: session.user.id,
    email: session.user.email,
  });

  return <CreatorConsoleView initial={data} />;
}
