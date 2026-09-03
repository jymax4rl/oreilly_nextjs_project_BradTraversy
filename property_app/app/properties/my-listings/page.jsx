import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";

export const metadata = {
  title: "My Listings | Isisel",
  robots: { index: false, follow: false },
};

/** Guest-nav URL kept for old bookmarks — host tools live in the console. */
export default async function MyListingsRedirectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/host/listings");
  }

  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  redirect("/host/listings");
}
