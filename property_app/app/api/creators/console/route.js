import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  buildCreatorConsole,
  claimCreatorInvite,
} from "@/utils/creators/creatorConsole";

/**
 * GET /api/creators/console — authenticated creator workspace
 */
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const data = await buildCreatorConsole({
      userId: session.user.id,
      email: session.user.email,
    });

    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/creators/console:", error);
    return Response.json({ error: "Failed to load creator console" }, { status: 500 });
  }
}

/**
 * POST /api/creators/console — claim invite token after Google sign-in
 * body: { token }
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await claimCreatorInvite({
      token: body.token,
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status || 400 });
    }

    const consoleData = await buildCreatorConsole({
      userId: session.user.id,
      email: session.user.email,
    });

    return Response.json({
      claimed: result.partner,
      console: consoleData,
    });
  } catch (error) {
    console.error("POST /api/creators/console:", error);
    return Response.json({ error: "Could not claim invite" }, { status: 500 });
  }
}
