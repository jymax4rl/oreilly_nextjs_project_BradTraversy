import bcrypt from "bcryptjs";
import connectToDatabase from "@/config/database";
import {
  MIN_OPS_PASSWORD_LENGTH,
  isFounderBootstrapOpen,
  resolveFounderCandidate,
} from "@/utils/opsFounder";

/**
 * One-time founder registration: set passwordHash + role superadmin while no
 * ops Credentials password exists. Never creates open public signup.
 */
export async function POST(request) {
  try {
    const connected = await connectToDatabase();
    if (!connected) {
      return Response.json(
        { error: "Database unavailable" },
        { status: 503 },
      );
    }

    // Re-check gate before any write (closes the window if another founder finished).
    if (!(await isFounderBootstrapOpen())) {
      return Response.json(
        { error: "Founder setup is closed. An ops password already exists." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(body?.password || "");
    const confirmPassword = String(body?.confirmPassword || "");

    if (password.length < MIN_OPS_PASSWORD_LENGTH) {
      return Response.json(
        {
          error: `Password must be at least ${MIN_OPS_PASSWORD_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }
    if (password !== confirmPassword) {
      return Response.json(
        { error: "Password and confirmation do not match." },
        { status: 400 },
      );
    }

    const resolved = await resolveFounderCandidate(email);
    if (!resolved.ok) {
      return Response.json(
        { error: resolved.error },
        { status: resolved.status },
      );
    }

    // Final gate after candidate lookup — avoid racing a parallel bootstrap.
    if (!(await isFounderBootstrapOpen())) {
      return Response.json(
        { error: "Founder setup is closed. An ops password already exists." },
        { status: 403 },
      );
    }

    const { user } = resolved;
    user.email = email;
    user.passwordHash = await bcrypt.hash(password, 12);
    user.role = "superadmin";
    await user.save();

    return Response.json({
      ok: true,
      email,
      role: "superadmin",
    });
  } catch (error) {
    console.error("ops founder-bootstrap failed:", error);
    return Response.json(
      { error: "Founder setup failed. Please try again." },
      { status: 500 },
    );
  }
}
