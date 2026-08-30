import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { getProfilePayload } from "@/utils/user/getProfilePayload";

/**
 * GET /api/user/profile — authenticated profile snapshot (no secrets).
 */
export const GET = async () => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const profile = await getProfilePayload(session.user);
    if (!profile) {
      return new Response("User not found", { status: 404 });
    }

    return Response.json({ profile });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return new Response("Failed to load profile", { status: 500 });
  }
};

/**
 * PATCH /api/user/profile — update safe editable fields (display name only).
 * Phone is not on the User model; seller phone lives on Property.seller_info.
 */
export const PATCH = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const updates = {};

    if (body.name !== undefined || body.username !== undefined) {
      const raw = body.name ?? body.username;
      if (typeof raw !== "string") {
        return new Response("name must be a string", { status: 400 });
      }
      const name = raw.trim().replace(/\s+/g, " ");
      if (name.length < 2 || name.length > 80) {
        return new Response("name must be 2–80 characters", { status: 400 });
      }
      updates.username = name;
    }

    if (Object.keys(updates).length === 0) {
      return new Response("No editable fields provided", { status: 400 });
    }

    // Reject unknown keys that look like privilege escalation attempts
    const allowedKeys = new Set(["name", "username"]);
    const extra = Object.keys(body).filter((k) => !allowedKeys.has(k));
    if (extra.length > 0) {
      return new Response(`Unsupported fields: ${extra.join(", ")}`, {
        status: 400,
      });
    }

    const result = await User.updateOne(
      { email: session.user.email },
      { $set: updates },
    );

    if (result.matchedCount === 0) {
      return new Response("User not found", { status: 404 });
    }

    const profile = await getProfilePayload(session.user);
    return Response.json({ profile });
  } catch (error) {
    console.error("PATCH /api/user/profile error:", error);
    return new Response("Failed to update profile", { status: 500 });
  }
};
