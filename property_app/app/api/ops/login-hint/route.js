import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { isOpsStaff } from "@/utils/opsAuth";
import { isFounderBootstrapOpen } from "@/utils/opsFounder";

/**
 * After a failed ops Credentials sign-in, return a safe, actionable hint.
 * Does not confirm whether a password was wrong for accounts that already have one.
 */
export async function POST(request) {
  try {
    const connected = await connectToDatabase();
    if (!connected) {
      return Response.json({ hint: null }, { status: 200 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return Response.json({ hint: null });
    }

    const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${escaped}$`, "i") },
    }).select("+passwordHash role");

    if (!user) {
      return Response.json({
        hint: "Invalid credentials or this account is not ops staff.",
      });
    }

    if (isOpsStaff(user.role) && !user.passwordHash) {
      const bootstrapOpen = await isFounderBootstrapOpen();
      return Response.json({
        hint: bootstrapOpen
          ? "This account has no ops password yet. Use founder setup below, or run npm run ops:set-password."
          : "This account has no ops password yet. Ask an existing ops admin, or run npm run ops:set-password.",
        code: "no_ops_password",
      });
    }

    if (!isOpsStaff(user.role)) {
      return Response.json({
        hint: "Invalid credentials or this account is not ops staff.",
        code: "not_ops",
      });
    }

    return Response.json({
      hint: "Invalid credentials or this account is not ops staff.",
      code: "auth_failed",
    });
  } catch (error) {
    console.error("ops login-hint failed:", error);
    return Response.json({
      hint: "Invalid credentials or this account is not ops staff.",
    });
  }
}
