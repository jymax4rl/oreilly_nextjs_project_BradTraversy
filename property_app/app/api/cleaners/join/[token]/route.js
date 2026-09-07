import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import CleaningInvite from "@/models/CleaningInvite";
import { acceptInvite } from "@/utils/cleaners/inviteFlow";

export const dynamic = "force-dynamic";

export async function GET(_request, context) {
  try {
    const { token } = await context.params;
    await connectToDatabase();
    const invite = await CleaningInvite.findOne({ token })
      .populate("hostId", "username")
      .lean();
    if (!invite) {
      return Response.json({ error: "Invite not found" }, { status: 404 });
    }
    const expired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
    return Response.json({
      invite: {
        name: invite.name,
        email: invite.email,
        hostName: invite.hostId?.username || "An Isisel host",
        status: expired && invite.status === "pending" ? "expired" : invite.status,
      },
    });
  } catch (error) {
    console.error("GET cleaner invite", error);
    return Response.json({ error: "Failed to load invite" }, { status: 500 });
  }
}

export async function POST(_request, context) {
  try {
    const { token } = await context.params;
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in to accept this invite" }, { status: 401 });
    }
    const result = await acceptInvite(token, session.user);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST cleaner invite", error);
    return Response.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
