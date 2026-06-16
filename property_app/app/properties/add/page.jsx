import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { redirect } from "next/navigation";
import ListingWizard from "@/components/listing/ListingWizard";
import { needsHostWelcome } from "@/utils/hostWelcomeOnboarding";

export const metadata = {
  title: "Add Property | Kama Properties",
};

export default async function AddPropertyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/properties/add");
  }

  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  if (needsHostWelcome(session.user)) {
    redirect("/onboarding");
  }

  return <ListingWizard />;
}
