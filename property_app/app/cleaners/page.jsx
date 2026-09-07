import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isActiveCleaner } from "@/utils/cleaners/auth";
import CleanerDashboard from "@/components/cleaners/CleanerDashboard";
import { CleanerNeedInvite } from "./layout";

export const dynamic = "force-dynamic";

export default async function CleanersHomePage() {
  const session = await getServerSession(authOptions);
  if (!isActiveCleaner(session?.user)) {
    return <CleanerNeedInvite />;
  }
  return <CleanerDashboard name={session.user.name} />;
}
