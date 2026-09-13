import connectToDatabase from "@/config/database";
import User from "@/models/User";
import HostApplication from "@/models/HostApplication";
import Property from "@/models/Property";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";
import mongoose from "mongoose";
import { serializeFoundingHostOps } from "@/utils/foundingHost/serialize";

/**
 * Ops-only user profile payload for the in-console profile modal.
 * Includes host verification ID fields and optional ID document image URLs.
 */
export const GET = async (_request, { params }) => {
  const { id } = await params;

  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user || !isOpsStaff(session.user.role)) {
      return new Response("Unauthorized", { status: 403 });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return new Response(`Invalid user ID: ${id}`, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(id);

    const [user, hostApplication, listingCount, sampleProperty] =
      await Promise.all([
        User.findById(userId)
          .select(
            "email username image role hostStatus banned bannedAt bannedReason bannedBy createdAt updatedAt hostAddress hasCompletedHostOnboarding termsVersion termsAcceptedAt foundingHost commissionOverride",
          )
          .lean(),
        HostApplication.findOne({ user: userId }).lean(),
        Property.countDocuments({ owner: userId }),
        Property.findOne({ owner: userId })
          .select("name")
          .sort({ updatedAt: -1 })
          .lean(),
      ]);

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const idDocumentUrls = Array.isArray(hostApplication?.idDocumentUrls)
      ? hostApplication.idDocumentUrls.filter(
          (url) => typeof url === "string" && url.trim(),
        )
      : [];

    return Response.json({
      user: {
        ...user,
        _id: String(user._id),
        bannedBy: user.bannedBy ? String(user.bannedBy) : null,
      },
      foundingHost: serializeFoundingHostOps(user),
      hostApplication: hostApplication
        ? {
            ...hostApplication,
            _id: String(hostApplication._id),
            user: String(hostApplication.user),
            idDocumentUrls,
            reviewedBy: hostApplication.reviewedBy
              ? String(hostApplication.reviewedBy)
              : null,
          }
        : null,
      stats: {
        listingCount,
      },
      /** First listing used so ops can message the host without leaving chrome. */
      messageContext: sampleProperty
        ? {
            propertyId: String(sampleProperty._id),
            propertyName: sampleProperty.name || "Listing",
          }
        : null,
    });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return new Response(`Failed to load user: ${error.message}`, {
      status: 500,
    });
  }
};

/**
 * Ops-only ban / unban. Body: `{ banned: boolean, reason?: string }`.
 * Cannot ban yourself or another ops staff account.
 */
export const PATCH = async (request, { params }) => {
  const { id } = await params;

  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user || !isOpsStaff(session.user.role)) {
      return new Response("Unauthorized - Admin access required", {
        status: 403,
      });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return new Response(`Invalid user ID: ${id}`, { status: 400 });
    }

    if (String(session.user.id) === String(id)) {
      return new Response("You cannot ban or unban your own account", {
        status: 400,
      });
    }

    const body = await request.json();
    const banned = body?.banned === true;
    const reason =
      typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";

    const user = await User.findById(new mongoose.Types.ObjectId(id));
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Protect ops accounts from accidental marketplace bans
    if (isOpsStaff(user.role)) {
      return new Response("Cannot ban ops staff accounts from this tool", {
        status: 400,
      });
    }

    if (banned) {
      user.banned = true;
      user.bannedAt = new Date();
      user.bannedReason = reason || null;
      user.bannedBy = new mongoose.Types.ObjectId(session.user.id);
    } else {
      user.banned = false;
      user.bannedAt = null;
      user.bannedReason = null;
      user.bannedBy = null;
    }

    await user.save();

    return Response.json({
      success: true,
      banned: user.banned,
      bannedAt: user.bannedAt,
      bannedReason: user.bannedReason,
      message: user.banned ? "User banned" : "User unbanned",
    });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return new Response(`Failed to update user: ${error.message}`, {
      status: 500,
    });
  }
};
