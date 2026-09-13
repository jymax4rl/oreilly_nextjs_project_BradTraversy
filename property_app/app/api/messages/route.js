import connectToDatabase from "@/config/database";
import Message from "@/models/Message";
import Property from "@/models/Property";
import { getAuthFromRequest } from "@/utils/getAuthFromRequest";
import { revalidatePath } from "next/cache";

/**
 * GET /api/messages — inbox for the authenticated user (cookie or Bearer).
 * Same query as getMessages: sender OR recipient, populated, newest first.
 * Response: { messages }
 */
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getAuthFromRequest(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const userId = session.user.id;
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate("sender", "username email image")
      .populate("recipient", "username email image")
      .populate("property", "name location images slug")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({
      messages: JSON.parse(JSON.stringify(messages)),
    });
  } catch (error) {
    console.error("GET /api/messages:", error);
    return Response.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

/**
 * POST /api/messages — send a guest↔host message (JSON body, not FormData).
 * Required: propertyId, recipientId, name, email, body. Optional: phone.
 * Rejects self-send. Creates Message with read: false.
 * Response: { success }
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getAuthFromRequest(request);
    if (!session?.user?.id) {
      return Response.json(
        { error: "You must be signed in to send a message." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const propertyId = body.propertyId;
    const recipientId = body.recipientId;
    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim() : "";
    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";
    const messageBody =
      typeof body.body === "string" ? body.body.trim() : "";

    if (!propertyId || !recipientId || !name || !email || !messageBody) {
      return Response.json(
        { error: "Please fill in all required fields." },
        { status: 400 },
      );
    }

    if (String(session.user.id) === String(recipientId)) {
      return Response.json(
        { error: "You cannot send a message to yourself." },
        { status: 400 },
      );
    }

    await Message.create({
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

    return Response.json(
      { success: "Message sent successfully!" },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/messages:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
