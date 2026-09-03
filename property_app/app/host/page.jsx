import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import Message from "@/models/Message";
import { isAwaitingListingModeration } from "@/utils/listingApproval";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import HostHomeView from "@/components/host/HostHomeView";

export const metadata = {
  title: "Home",
  robots: { index: false, follow: false },
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
  const properties = await Property.find({ owner: ownerId })
    .select("name status images location listingModerationRequestedAt")
    .sort({ updatedAt: -1 })
    .lean();

  const propertyIds = properties.map((p) => p._id);
  const today = todayIso();

  const [pendingBookings, pendingCount, upcomingStays, unread] =
    await Promise.all([
      propertyIds.length
        ? Booking.find({
            propertyId: { $in: propertyIds },
            status: "pending",
            listed: { $ne: false },
          })
            .sort({ checkIn: 1 })
            .limit(6)
            .lean()
        : [],
      propertyIds.length
        ? Booking.countDocuments({
            propertyId: { $in: propertyIds },
            status: "pending",
            listed: { $ne: false },
          })
        : 0,
      propertyIds.length
        ? Booking.find({
            propertyId: { $in: propertyIds },
            status: { $in: ["pending", "confirmed"] },
            listed: { $ne: false },
            checkIn: { $gte: today },
          })
            .sort({ checkIn: 1 })
            .limit(6)
            .lean()
        : [],
      Message.countDocuments({
        recipient: ownerId,
        read: false,
      }),
    ]);

  const listingsPending = properties.filter((p) =>
    isAwaitingListingModeration(p),
  ).length;

  const stats = {
    listings: properties.length,
    awaiting: listingsPending,
    requests: pendingCount,
    unread,
  };

  return (
    <HostHomeView
      stats={stats}
      pendingBookings={pendingBookings.map((b) => ({
        id: String(b._id),
        propertyName: b.propertyName,
        guestName: b.guestName,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
      }))}
      upcomingStays={upcomingStays.map((b) => ({
        id: String(b._id),
        propertyName: b.propertyName,
        guestName: b.guestName,
        checkIn: b.checkIn,
        status: b.status,
      }))}
    />
  );
}
