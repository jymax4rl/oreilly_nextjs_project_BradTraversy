import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import User from "@/models/User";
import Property from "@/models/Property";
import Booking from "@/models/Booking";

export const dynamic = "force-dynamic";

async function requireHost(session) {
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };
  if (session.user.hostStatus !== "verified") {
    return { error: "Verified hosts only", status: 403 };
  }
  return null;
}

async function pendingReservationCount(userId) {
  const properties = await Property.find({ owner: userId }).select("_id").lean();
  const ids = properties.map((p) => p._id);
  if (ids.length === 0) return 0;
  return Booking.countDocuments({
    propertyId: { $in: ids },
    status: "pending",
    listed: { $ne: false },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = await requireHost(session);
  if (denied) {
    return Response.json({ error: denied.error }, { status: denied.status });
  }

  const ok = await connectToDatabase();
  if (!ok) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  const [user, pending] = await Promise.all([
    User.findById(session.user.id).select("hostPushBadge").lean(),
    pendingReservationCount(session.user.id),
  ]);

  return Response.json({
    badge: Math.max(0, Number(user?.hostPushBadge) || 0),
    pending,
  });
}

/** Opening the host console clears the home-screen icon count. */
export async function POST() {
  const session = await getServerSession(authOptions);
  const denied = await requireHost(session);
  if (denied) {
    return Response.json({ error: denied.error }, { status: denied.status });
  }

  const ok = await connectToDatabase();
  if (!ok) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  await User.updateOne(
    { _id: session.user.id },
    { $set: { hostPushBadge: 0 } },
  );
  return Response.json({ badge: 0 });
}
