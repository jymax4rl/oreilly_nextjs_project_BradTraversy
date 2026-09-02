import { isValidObjectId } from "mongoose";
import HostProspect from "@/models/HostProspect";
import User from "@/models/User";
import Property from "@/models/Property";
import HostApplication from "@/models/HostApplication";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { recordActivity } from "@/utils/acquisition/recordActivity";
import { serializeProspect } from "@/utils/acquisition/prospects";
import { normalizeEmail } from "@/utils/user/ensureMarketplaceUser";

/**
 * POST /api/ops/acquisition/prospects/[id]/convert
 * Links an existing marketplace user — never creates a duplicate account.
 */
export async function POST(request, { params }) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;
    const id = (await params).id;
    if (!isValidObjectId(id)) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const prospect = await HostProspect.findById(id);
    if (!prospect) return Response.json({ error: "Not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    let user = null;

    if (body.userId && isValidObjectId(body.userId)) {
      user = await User.findById(body.userId);
    }

    const email = normalizeEmail(body.email || prospect.email);
    if (!user && email) {
      const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      user = await User.findOne({
        email: { $regex: new RegExp(`^${escaped}$`, "i") },
      });
    }

    if (!user) {
      return Response.json(
        {
          error:
            "No matching Isisel account. Ask the host to sign in, then convert again.",
          needsAccount: true,
        },
        { status: 409 },
      );
    }

    const ownerId = String(user._id);
    const propertyCount = await Property.countDocuments({
      $or: [{ owner: ownerId }, { owner: user._id }],
    });
    const application = await HostApplication.findOne({ user: user._id })
      .select("status phone")
      .lean();

    prospect.convertedUser = user._id;
    prospect.convertedAt = new Date();
    prospect.convertedPropertyCount = propertyCount;
    prospect.stage = "converted";
    prospect.archived = false;
    await prospect.save();

    await recordActivity({
      prospectId: prospect._id,
      type: "converted",
      description: `Converted to Isisel host ${user.username || user.email}. ${propertyCount} listing${propertyCount === 1 ? "" : "s"} on the marketplace.`,
      meta: {
        userId: ownerId,
        propertyCount,
        hostStatus: user.hostStatus,
      },
      session: gate.session,
    });

    return Response.json({
      prospect: serializeProspect(prospect.toObject()),
      host: {
        id: ownerId,
        email: user.email,
        username: user.username,
        hostStatus: user.hostStatus,
        role: user.role,
        propertyCount,
        applicationStatus: application?.status || null,
      },
    });
  } catch (error) {
    console.error("acquisition convert POST:", error);
    return Response.json({ error: "Failed to convert prospect" }, { status: 500 });
  }
}
