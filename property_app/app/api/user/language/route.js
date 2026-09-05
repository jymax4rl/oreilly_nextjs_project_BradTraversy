import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { parseUserLocale } from "@/utils/user/resolveUserLocale";

/**
 * PATCH /api/user/language — persist the signed-in user's site language.
 * Body: { language: "en" | "fr" }
 */
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const language = parseUserLocale(body?.language);
    if (!language) {
      return Response.json({ error: "language must be en or fr" }, { status: 400 });
    }

    const ok = await connectToDatabase();
    if (!ok) {
      return new Response("Database unavailable", { status: 503 });
    }

    const result = await User.updateOne(
      { email: session.user.email },
      { $set: { "preferences.language": language } },
    );
    if (result.matchedCount === 0) {
      return new Response("User not found", { status: 404 });
    }

    return Response.json({ ok: true, language });
  } catch (error) {
    console.error("PATCH /api/user/language:", error);
    return new Response("Failed to save language", { status: 500 });
  }
}
