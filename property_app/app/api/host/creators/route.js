import connectToDatabase from "@/config/database";
import CreatorPartner from "@/models/CreatorPartner";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import { buildHostCreatorsProgram } from "@/utils/host/creatorsProgram";

const PLATFORMS = new Set([
  "instagram",
  "tiktok",
  "youtube",
  "multiple",
  "other",
]);

function normalizeProfileUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value.slice(0, 500);
  if (/^[\w.-]+\.[\w.-]+/i.test(value) || value.startsWith("@")) {
    return value.slice(0, 500);
  }
  return value.slice(0, 500);
}

function isUsableProfileUrl(value) {
  const v = String(value || "").trim();
  if (v.length < 2) return false;
  // Accept @handles, bare domains/paths, or full URLs
  return (
    v.startsWith("@") ||
    /^https?:\/\//i.test(v) ||
    /[\w./@-]{2,}/i.test(v)
  );
}

/**
 * GET /api/host/creators — program summary + partners + codes
 * POST /api/host/creators — create a creator partner
 */
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const program = await buildHostCreatorsProgram(session.user.id);
    return Response.json(program);
  } catch (error) {
    console.error("GET /api/host/creators:", error);
    return Response.json({ error: "Failed to load creators program" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name || name.length < 2) {
      return Response.json(
        { error: "Creator name is required (at least 2 characters)" },
        { status: 400 },
      );
    }

    const platform = String(body.platform || "").trim().toLowerCase();
    if (!PLATFORMS.has(platform)) {
      return Response.json(
        { error: "Select the creator’s platform" },
        { status: 400 },
      );
    }

    const profileUrl = normalizeProfileUrl(body.profileUrl);
    if (!isUsableProfileUrl(profileUrl)) {
      return Response.json(
        { error: "Creator social profile / handle is required" },
        { status: 400 },
      );
    }

    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const partner = await CreatorPartner.create({
      hostId: session.user.id,
      name: name.slice(0, 120),
      email: email.slice(0, 254),
      platform,
      profileUrl,
      notes: String(body.notes || "").trim().slice(0, 2000),
      status: "active",
    });
    partner.ensurePortalToken();
    await partner.save();

    return Response.json(
      {
        id: String(partner._id),
        name: partner.name,
        email: partner.email,
        platform: partner.platform,
        profileUrl: partner.profileUrl,
        notes: partner.notes,
        status: partner.status,
        portalToken: partner.portalToken,
        portalUrl: `/creators/join/${partner.portalToken}`,
        joinUrl: `/creators/join/${partner.portalToken}`,
        earningsUrl: `/creators/portal/${partner.portalToken}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/host/creators:", error);
    return Response.json({ error: "Could not add creator" }, { status: 500 });
  }
}
