import connectToDatabase from "@/config/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import {
  assertCreatorPropertyAccess,
  getCreatorPropertyAvailability,
} from "@/utils/creators/creatorConsole";

/**
 * GET /api/creators/properties/[id]/availability
 * Calendar data for a listing the creator has a promo code on.
 */
export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await params;
    const access = await assertCreatorPropertyAccess({
      userId: session.user.id,
      email: session.user.email,
      propertyId: id,
    });
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    const result = await getCreatorPropertyAvailability(id);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    return Response.json({
      ...result,
      code: {
        code: access.code.code,
        status: access.code.status,
        commissionRate: access.code.commissionRate,
        updatedAt: access.code.updatedAt,
      },
      promotionActive: access.promotionActive,
      pauseReason: access.pauseReason,
    });
  } catch (error) {
    console.error("GET /api/creators/properties/[id]/availability:", error);
    return Response.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
