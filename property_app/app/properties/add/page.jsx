import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { redirect } from "next/navigation";
import PropertyAddForm from "@/components/PropertyAddForm";

export const metadata = {
  title: "Add Property | Kama Properties",
};

export default async function AddPropertyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/properties/add");
  }

  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <PropertyAddForm />
    </main>
  );
}
