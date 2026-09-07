import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

/** Loose IBAN check: country code + checksum digits + alphanumeric, length 15–34. */
function normalizeIban(raw) {
  return String(raw || "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function isValidIban(iban) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  return iban.length >= 15 && iban.length <= 34;
}

function maskIban(iban) {
  if (!iban || iban.length < 8) return null;
  return `${iban.slice(0, 4)}••••${iban.slice(-4)}`;
}

/**
 * GET /api/user/host-payout — host-only payout profile (masked IBAN).
 */
export const GET = async () => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email })
      .select("role hostStatus hostPayout")
      .lean();
    if (!user) return new Response("User not found", { status: 404 });

    const isHost =
      user.role === "host" ||
      user.role === "admin" ||
      user.role === "superadmin" ||
      user.hostStatus === "verified";
    if (!isHost) {
      return Response.json({ error: "Host access required" }, { status: 403 });
    }

    const iban = user.hostPayout?.iban || null;
    return Response.json({
      payout: {
        ibanMasked: maskIban(iban),
        hasIban: Boolean(iban),
        accountName: user.hostPayout?.accountName || null,
        updatedAt: user.hostPayout?.updatedAt || null,
      },
    });
  } catch (error) {
    console.error("GET /api/user/host-payout error:", error);
    return new Response("Failed to load payout profile", { status: 500 });
  }
};

/**
 * PATCH /api/user/host-payout — save host IBAN for platform-managed settlement.
 * Guests pay Isisel via Creem; this IBAN is for later host transfers (ops/splits).
 */
export const PATCH = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).select(
      "role hostStatus hostPayout",
    );
    if (!user) return new Response("User not found", { status: 404 });

    const isHost =
      user.role === "host" ||
      user.role === "admin" ||
      user.role === "superadmin" ||
      user.hostStatus === "verified";
    if (!isHost) {
      return Response.json({ error: "Host access required" }, { status: 403 });
    }

    const body = await request.json();
    const iban = normalizeIban(body.iban);
    const accountName = String(body.accountName || "").trim().slice(0, 120);

    if (!isValidIban(iban)) {
      return Response.json(
        {
          error:
            "Enter a valid IBAN (country code + account number, 15–34 characters).",
        },
        { status: 400 },
      );
    }
    if (!accountName) {
      return Response.json(
        { error: "Account holder name is required." },
        { status: 400 },
      );
    }

    user.hostPayout = {
      iban,
      accountName,
      updatedAt: new Date(),
    };
    await user.save();

    return Response.json({
      payout: {
        ibanMasked: maskIban(iban),
        hasIban: true,
        accountName,
        updatedAt: user.hostPayout.updatedAt,
      },
    });
  } catch (error) {
    console.error("PATCH /api/user/host-payout error:", error);
    return new Response("Failed to save payout profile", { status: 500 });
  }
};
