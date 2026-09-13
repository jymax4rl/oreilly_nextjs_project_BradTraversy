import { buildCreatorPortal } from "@/utils/creators/creatorPortal";
import connectToDatabase from "@/config/database";

/**
 * GET /api/creators/portal/[token]
 * Public read-only creator earnings portal.
 */
export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const { token } = await params;
    if (!token || String(token).length < 16) {
      return Response.json({ error: "Invalid portal link" }, { status: 400 });
    }

    const portal = await buildCreatorPortal(token);
    if (!portal) {
      return Response.json({ error: "Portal not found" }, { status: 404 });
    }

    return Response.json(portal, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/creators/portal/[token]:", error);
    return Response.json({ error: "Failed to load portal" }, { status: 500 });
  }
}
