import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import HostCalendarHubView from "@/components/host/HostCalendarHubView";

export const metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

export default async function HostCalendarHubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(getLoginUrl("/host/calendar"));
  }
  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  await connectToDatabase();
  const properties = await Property.find({ owner: session.user.id })
    .select("name location")
    .sort({ name: 1 })
    .lean();

  return (
    <HostCalendarHubView
      properties={properties.map((p) => ({
        id: String(p._id),
        name: p.name,
        city: p.location?.city,
        country: p.location?.country,
      }))}
    />
  );
}
