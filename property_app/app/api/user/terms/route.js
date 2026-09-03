import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { TERMS_VERSION } from "@/lib/legal/constants";

/**
 * POST /api/user/terms — record Terms acceptance for the signed-in user.
 * Body: { version?: string } — must match current TERMS_VERSION when provided.
 */
export const POST = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const version =
      typeof body.version === "string" && body.version.trim()
        ? body.version.trim()
        : TERMS_VERSION;

    if (version !== TERMS_VERSION) {
      return Response.json(
        { error: "Unsupported terms version", current: TERMS_VERSION },
        { status: 400 },
      );
    }

    const acceptedAt = new Date();
    await User.updateOne(
      { email: session.user.email },
      {
        $set: {
          termsVersion: version,
          termsAcceptedAt: acceptedAt,
        },
      },
    );

    return Response.json({
      ok: true,
      termsVersion: version,
      termsAcceptedAt: acceptedAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/user/terms error:", error);
    return new Response("Failed to record terms acceptance", { status: 500 });
  }
};
