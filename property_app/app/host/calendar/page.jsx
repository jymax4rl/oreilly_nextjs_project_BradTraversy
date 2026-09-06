import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import { formatDateOnly } from "@/utils/availability/dateUtils";
import HostCalendarHubView from "@/components/host/HostCalendarHubView";

export const metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

function utcTodayYmd() {
  return formatDateOnly(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  ));
}

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
    .select("name location images")
    .sort({ name: 1 })
    .lean();

  const propertyIds = properties.map((p) => p._id);
  const today = utcTodayYmd();
  const counts = propertyIds.length
    ? await Booking.aggregate([
        {
          $match: {
            propertyId: { $in: propertyIds },
            status: { $in: ["pending", "confirmed"] },
            listed: { $ne: false },
            checkOut: { $gt: today },
          },
        },
        { $group: { _id: "$propertyId", n: { $sum: 1 } } },
      ])
    : [];
  const countById = new Map(counts.map((row) => [String(row._id), row.n]));

  return (
    <HostCalendarHubView
      properties={properties.map((p) => ({
        id: String(p._id),
        name: p.name,
        city: p.location?.city,
        country: p.location?.country,
        image: p.images?.[0] || null,
        futureCount: countById.get(String(p._id)) || 0,
      }))}
    />
  );
}
