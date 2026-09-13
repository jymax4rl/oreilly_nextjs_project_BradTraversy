"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Booking from "@/models/Booking";
import Message from "@/models/Message";
import Property from "@/models/Property";

/**
 * Counts for host chrome: unread inbox + pending reservation requests.
 */
export async function getHostNavCounts() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { unreadMessages: 0, pendingReservations: 0 };
  }

  const userId = session.user.id;
  const properties = await Property.find({ owner: userId }).select("_id").lean();
  const ids = properties.map((p) => p._id);

  const [unreadMessages, pendingReservations] = await Promise.all([
    Message.countDocuments({
      recipient: userId,
      read: false,
    }),
    ids.length
      ? Booking.countDocuments({
          propertyId: { $in: ids },
          status: "pending",
          listed: { $ne: false },
        })
      : 0,
  ]);

  return { unreadMessages, pendingReservations };
}
