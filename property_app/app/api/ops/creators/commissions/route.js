import CreatorCommission from "@/models/CreatorCommission";
import {
  finalizeEligibleCommissions,
  transitionCommissionStatus,
  aggregateCommissionLedger,
} from "@/utils/creators/commissionEngine";
import { requireOpsApi, opsActor } from "@/utils/ops/requireOpsApi";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/creators/commissions
 * Ledger queue for ops payout workflow.
 */
export async function GET(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50) || 50));

    const query = {};
    if (status) query.status = status;

    const [docs, total, ledger] = await Promise.all([
      CreatorCommission.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CreatorCommission.countDocuments(query),
      aggregateCommissionLedger({}),
    ]);

    return Response.json(
      {
        commissions: docs.map((c) => ({
          id: String(c._id),
          bookingId: String(c.bookingId),
          hostId: c.hostId,
          creatorPartnerId: String(c.creatorPartnerId),
          creatorPartnerName: c.creatorPartnerName,
          propertyName: c.propertyName,
          promoCode: c.promoCode,
          amount: c.amount,
          accommodationBase: c.accommodationBase,
          currency: c.currency,
          status: c.status,
          checkIn: c.checkIn,
          checkOut: c.checkOut,
          guestName: c.guestName,
          bookingStatus: c.bookingStatus,
          payoutReference: c.payoutReference || "",
          holdReason: c.holdReason || "",
          accruedAt: c.accruedAt,
          paidAt: c.paidAt,
        })),
        total,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        summary: ledger.summary,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Ops creator commissions GET failed:", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/ops/creators/commissions
 * body: { id, status, note?, payoutReference? }
 * or { action: "finalize" } to run post-stay accrual job
 */
export async function PATCH(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const body = await request.json().catch(() => ({}));
    const actor = opsActor(gate.session);

    if (body.action === "finalize") {
      const result = await finalizeEligibleCommissions({
        actor: actor.email || actor.id || "ops",
        limit: Number(body.limit) || 500,
      });
      return Response.json(result);
    }

    if (!body.id || !body.status) {
      return Response.json(
        { error: "id and status required" },
        { status: 400 },
      );
    }

    const result = await transitionCommissionStatus(body.id, body.status, {
      actor: actor.email || actor.id || "ops",
      note: body.note || "",
      payoutReference: body.payoutReference || "",
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error },
        { status: result.status || 400 },
      );
    }

    return Response.json({ commission: result.commission });
  } catch (error) {
    console.error("Ops creator commissions PATCH failed:", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
