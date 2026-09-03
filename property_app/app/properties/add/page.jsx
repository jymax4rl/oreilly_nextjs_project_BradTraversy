import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { redirect } from "next/navigation";
import ListingWizard from "@/components/listing/ListingWizard";

export const metadata = {
  title: "Add Property | Isisel",
  robots: { index: false, follow: false },
};

export default async function AddPropertyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/properties/add");
  }

  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  return <ListingWizard />;
}
