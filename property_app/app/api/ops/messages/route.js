import Message from "@/models/Message";
import User from "@/models/User";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { OPS_ROLES } from "@/utils/opsAuth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const FILTERS = new Set(["sent", "mine", "inbox"]);

function serializePerson(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.username || "",
    email: doc.email || "",
    image: doc.image || null,
    hostStatus: doc.hostStatus || "none",
  };
}

/**
 * GET /api/ops/messages
 * Ops outbound (and inbound replies) across all staff accounts.
 * ?filter=sent|mine|inbox  ?q=  ?limit=
 */
export async function GET(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const { searchParams } = new URL(request.url);
    const rawFilter = searchParams.get("filter") || "sent";
    const filter = FILTERS.has(rawFilter) ? rawFilter : "sent";
    const q = String(searchParams.get("q") || "").trim().slice(0, 120);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 100) || 100));

    const staff = await User.find({ role: { $in: [...OPS_ROLES] } })
      .select("_id")
      .lean();
    const staffIds = staff.map((u) => u._id);
    const me = gate.session.user.id;
    const meOid = mongoose.Types.ObjectId.isValid(me)
      ? new mongoose.Types.ObjectId(me)
      : null;

    const query = {};
    if (filter === "mine" && meOid) {
      query.sender = meOid;
    } else if (filter === "inbox") {
      query.recipient = { $in: staffIds };
    } else {
      query.sender = { $in: staffIds };
    }

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      const matchedPeople = await User.find({
        $or: [{ email: rx }, { username: rx }],
      })
        .select("_id")
        .lean();
      const peopleIds = matchedPeople.map((u) => u._id);
      const textMatch = {
        $or: [{ body: rx }, { name: rx }, { email: rx }],
      };
      if (peopleIds.length) {
        textMatch.$or.push({ recipient: { $in: peopleIds } });
        textMatch.$or.push({ sender: { $in: peopleIds } });
      }
      query.$and = [...(query.$and || []), textMatch];
    }

    const [docs, sentCount, mineCount, inboxCount] = await Promise.all([
      Message.find(query)
        .populate("sender", "username email image hostStatus")
        .populate("recipient", "username email image hostStatus")
        .populate("property", "name slug")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Message.countDocuments({ sender: { $in: staffIds } }),
      meOid ? Message.countDocuments({ sender: meOid }) : 0,
      Message.countDocuments({ recipient: { $in: staffIds } }),
    ]);

    const messages = docs.map((doc) => ({
      id: String(doc._id),
      body: doc.body || "",
      createdAt: doc.createdAt,
      read: Boolean(doc.read),
      sender: serializePerson(doc.sender),
      recipient: serializePerson(doc.recipient),
      property: doc.property
        ? {
            id: String(doc.property._id),
            name: doc.property.name || "Listing",
            slug: doc.property.slug || "",
          }
        : null,
    }));

    return Response.json(
      {
        messages,
        shown: messages.length,
        counts: {
          sent: sentCount,
          mine: mineCount,
          inbox: inboxCount,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/ops/messages error:", error);
    return new Response("Failed to load messages", { status: 500 });
  }
}
