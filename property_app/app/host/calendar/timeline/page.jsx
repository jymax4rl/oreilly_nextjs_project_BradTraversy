import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import HostReservationsCalendar from "@/components/host/calendar/HostReservationsCalendar";

export const metadata = {
  title: "Reservations calendar",
  robots: { index: false, follow: false },
};

export default async function HostReservationsTimelinePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(getLoginUrl("/host/calendar/timeline"));
  }
  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  await connectToDatabase();
  const properties = await Property.find({ owner: session.user.id })
    .select("name location images")
    .sort({ name: 1 })
    .lean();

  return (
    <HostReservationsCalendar
      initialProperties={properties.map((p) => ({
        id: String(p._id),
        name: p.name,
        city: p.location?.city || "",
        country: p.location?.country || "",
        image: p.images?.[0] || null,
      }))}
    />
  );
}
