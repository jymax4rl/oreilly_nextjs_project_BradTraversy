import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import connectDB from "@/config/database";
import User from "@/models/User";

export async function getCleanerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "Authentication required" };
  }
  await connectDB();
  const user = await User.findById(session.user.id)
    .select("_id username email image role cleanerStatus banned")
    .lean();
  if (!user) {
    return { ok: false, status: 401, error: "Account not found" };
  }
  if (user.banned) {
    return { ok: false, status: 403, error: "Account is suspended" };
  }
  const isActiveCleaner =
    user.cleanerStatus === "active" || user.role === "cleaner";
  if (!isActiveCleaner) {
    return { ok: false, status: 403, error: "Cleaner access required" };
  }
  return { ok: true, user, session };
}

export function isActiveCleaner(user) {
  return Boolean(user && (user.cleanerStatus === "active" || user.role === "cleaner"));
}
