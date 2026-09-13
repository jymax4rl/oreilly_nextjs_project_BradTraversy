import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import Message from "@/models/Message";
import { isAwaitingListingModeration } from "@/utils/listingApproval";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import { addDaysYmd, localTodayYmd } from "@/utils/host/reservationsCalendar";
import HostHomeView from "@/components/host/home/HostHomeView";
import User from "@/models/User";
import { serializeFoundingHostPublic } from "@/utils/foundingHost/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home",
  robots: { index: false, follow: false },
};

function serializeStay(booking) {
  return {
    id: String(booking._id),
    propertyName: booking.propertyName || "",
    guestName: booking.guestName || "",
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    status: booking.status,
  };
}

export default async function HostConsoleHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(getLoginUrl("/host"));
  }

  if (session.user.hostStatus !== "verified") {
    if (session.user.hostStatus === "onboarding") {
      redirect("/host/pending");
    }
    redirect("/host/onboarding");
  }

  await connectToDatabase();

  const ownerId = session.user.id;
  const today = localTodayYmd();
  const from = addDaysYmd(today, -2);
  const to = addDaysYmd(today, 14);

  const properties = await Property.find({ owner: ownerId })
    .select("name status listingModerationRequestedAt")
    .sort({ updatedAt: -1 })
    .lean();

  const propertyIds = properties.map((p) => p._id);

  const [bookings, unread] = await Promise.all([
    propertyIds.length
      ? Booking.find({
          propertyId: { $in: propertyIds },
          listed: { $ne: false },
          $or: [
            { status: "pending" },
            {
              status: "confirmed",
              checkIn: { $lte: to },
              checkOut: { $gte: from },
            },
          ],
        })
          .select("propertyName guestName checkIn checkOut status listed")
          .sort({ checkIn: 1 })
          .limit(400)
          .lean()
      : [],
    Message.countDocuments({
      recipient: ownerId,
      read: false,
    }),
  ]);

  const awaiting = properties.filter((p) =>
    isAwaitingListingModeration(p),
  ).length;

  const hostUser = await User.findById(ownerId)
    .select("foundingHost")
    .lean();

  return (
    <HostHomeView
      listings={properties.length}
      unread={unread}
      awaiting={awaiting}
      stays={bookings.map(serializeStay)}
      foundingHost={serializeFoundingHostPublic(hostUser)}
    />
  );
}
