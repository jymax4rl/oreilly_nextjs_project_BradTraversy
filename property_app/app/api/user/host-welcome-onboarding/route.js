import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

/** Mark the cinematic host welcome flow at /onboarding as completed (idempotent). */
export const POST = async () => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "host") {
      return new Response("Forbidden", { status: 403 });
    }

    await User.updateOne(
      { email: session.user.email },
      { $set: { hasCompletedHostOnboarding: true } },
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST host-welcome-onboarding error:", error);
    return new Response("Failed to update preferences", { status: 500 });
  }
};
