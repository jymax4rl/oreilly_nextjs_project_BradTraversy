import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";

const SAFE_FIELDS =
  "email username image role hostStatus banned bannedAt createdAt updatedAt";

const FILTERS = new Set([
  "all",
  "guest",
  "applicant",
  "host",
  "staff",
  "banned",
]);

function filterQuery(filter) {
  switch (filter) {
    case "guest":
      return {
        role: { $nin: ["admin", "superadmin", "host"] },
        hostStatus: "none",
      };
    case "applicant":
      return { hostStatus: { $in: ["onboarding", "rejected"] } };
    case "host":
      return {
        $or: [{ hostStatus: "verified" }, { role: "host" }],
      };
    case "staff":
      return { role: { $in: ["admin", "superadmin"] } };
    case "banned":
      return { banned: true };
    default:
      return {};
  }
}

function serializeUser(user) {
  return {
    _id: String(user._id),
    email: user.email || "",
    username: user.username || "",
    image: user.image || null,
    role: user.role || "guest",
    hostStatus: user.hostStatus || "none",
    banned: Boolean(user.banned),
    bannedAt: user.bannedAt || null,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

/**
 * GET /api/ops/users
 * Ops-only directory of every marketplace account (guests, hosts, staff).
 */
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user || !isOpsStaff(session.user.role)) {
      return new Response("Unauthorized", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawFilter = searchParams.get("filter") || "all";
    const filter = FILTERS.has(rawFilter) ? rawFilter : "all";
    const q = String(searchParams.get("q") || "").trim().slice(0, 120);

    const query = { ...filterQuery(filter) };
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      const textMatch = { $or: [{ email: rx }, { username: rx }] };
      query.$and = [...(query.$and || []), textMatch];
    }

    const [users, total, guestCount, applicantCount, hostCount, staffCount, bannedCount] =
      await Promise.all([
        User.find(query)
          .select(SAFE_FIELDS)
          .sort({ createdAt: -1 })
          .limit(500)
          .lean(),
        User.countDocuments({}),
        User.countDocuments(filterQuery("guest")),
        User.countDocuments(filterQuery("applicant")),
        User.countDocuments(filterQuery("host")),
        User.countDocuments(filterQuery("staff")),
        User.countDocuments(filterQuery("banned")),
      ]);

    return Response.json({
      users: users.map(serializeUser),
      total,
      shown: users.length,
      counts: {
        all: total,
        guest: guestCount,
        applicant: applicantCount,
        host: hostCount,
        staff: staffCount,
        banned: bannedCount,
      },
    });
  } catch (error) {
    console.error("Ops users GET error:", error);
    return new Response("Failed to load users", { status: 500 });
  }
}
