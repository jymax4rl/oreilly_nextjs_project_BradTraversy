import connectToDatabase from "@/config/database";
import Message from "@/models/Message";
import Property from "@/models/Property";
import User from "@/models/User";
import { getAuthFromRequest } from "@/utils/getAuthFromRequest";
import {
  buildConversationDTOs,
  toMessageDTO,
} from "@/utils/messages/messageDto";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import {
  expoClientCorsJson,
  expoClientCorsPreflight,
  withExpoClientCors,
} from "@/utils/mobileAuth/expoClientCors";

/**
 * CONTRACT v1 — dual-gate guest↔host messaging (cookie | Bearer via getAuthFromRequest).
 *
 * GET /api/messages
 *   Default → { conversations: ConversationDTO[], total }
 *   ?propertyId=&peerId= → { messages: MessageDTO[] } chronological for that thread
 *
 * POST /api/messages
 *   Body: { propertyId, recipientId, name, email, body, phone? }
 *   → 201 { message: MessageDTO }
 */

function requireAuth(session, request) {
  if (!session?.user?.id) {
    return expoClientCorsJson(request, { error: "Sign in required" }, 401);
  }
  return null;
}

export async function OPTIONS(request) {
  return expoClientCorsPreflight(request);
}

/**
 * GET /api/messages
 */
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getAuthFromRequest(request);
    const unauthorized = requireAuth(session, request);
    if (unauthorized) return unauthorized;

    const meId = String(session.user.id);
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const peerId = searchParams.get("peerId");

    // Thread mode: both query params required together.
    if (propertyId || peerId) {
      if (!propertyId || !peerId) {
        return withExpoClientCors(request, Response.json(
          { error: "propertyId and peerId are both required for thread view" },
          { status: 400 },
        ));
      }
      if (
        !mongoose.Types.ObjectId.isValid(propertyId) ||
        !mongoose.Types.ObjectId.isValid(peerId)
      ) {
        return withExpoClientCors(request, Response.json(
          { error: "Invalid propertyId or peerId" },
          { status: 400 },
        ));
      }

      const messages = await Message.find({
        property: propertyId,
        $or: [
          { sender: meId, recipient: peerId },
          { sender: peerId, recipient: meId },
        ],
      })
        .sort({ createdAt: 1 })
        .lean();

      return withExpoClientCors(request, Response.json({
        messages: messages.map(toMessageDTO),
      }));
    }

    // Conversation list (default).
    const messages = await Message.find({
      $or: [{ sender: meId }, { recipient: meId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const propertyIds = new Set();
    const userIds = new Set([meId]);
    for (const m of messages) {
      propertyIds.add(String(m.property));
      userIds.add(String(m.sender));
      userIds.add(String(m.recipient));
    }

    const [properties, users] = await Promise.all([
      propertyIds.size
        ? Property.find({ _id: { $in: [...propertyIds] } })
            .select("name slug images")
            .lean()
        : [],
      userIds.size
        ? User.find({ _id: { $in: [...userIds] } })
            .select("username image")
            .lean()
        : [],
    ]);

    const propertyById = new Map(
      properties.map((p) => [String(p._id), p]),
    );
    const userById = new Map(
      users.map((u) => [
        String(u._id),
        {
          _id: String(u._id),
          username: u.username || "",
          image: u.image || undefined,
        },
      ]),
    );

    const conversations = buildConversationDTOs(
      messages,
      meId,
      propertyById,
      userById,
    );

    return withExpoClientCors(request, Response.json({
      conversations,
      total: conversations.length,
    }));
  } catch (error) {
    console.error("GET /api/messages:", error);
    return withExpoClientCors(request, Response.json({ error: "Failed to load messages" }, { status: 500 }));
  }
}

/**
 * POST /api/messages
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getAuthFromRequest(request);
    const unauthorized = requireAuth(session, request);
    if (unauthorized) return unauthorized;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return withExpoClientCors(request, Response.json({ error: "Invalid JSON" }, { status: 400 }));
    }

    const propertyId = body.propertyId;
    const recipientId = body.recipientId;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const messageBody =
      typeof body.body === "string" ? body.body.trim() : "";

    if (!propertyId || !recipientId || !name || !email || !messageBody) {
      return withExpoClientCors(request, Response.json(
        { error: "Please fill in all required fields." },
        { status: 400 },
      ));
    }

    if (String(session.user.id) === String(recipientId)) {
      return withExpoClientCors(request, Response.json(
        { error: "You cannot send a message to yourself." },
        { status: 400 },
      ));
    }

    const created = await Message.create({
      sender: session.user.id,
      recipient: recipientId,
      property: propertyId,
      name,
      email,
      phone: phone || undefined,
      body: messageBody,
      read: false,
    });

    revalidatePath("/messages");
    revalidatePath(`/properties/${propertyId}`);
    const listed = await Property.findById(propertyId).select("slug").lean();
    if (listed?.slug) {
      revalidatePath(`/properties/${listed.slug}`);
    }

    return withExpoClientCors(request, Response.json(
      { message: toMessageDTO(created) },
      { status: 201 },
    ));
  } catch (error) {
    console.error("POST /api/messages:", error);
    return withExpoClientCors(request, Response.json({ error: "Failed to send message" }, { status: 500 }));
  }
}
