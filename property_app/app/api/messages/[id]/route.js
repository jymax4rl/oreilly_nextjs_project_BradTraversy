import connectToDatabase from "@/config/database";
import Message from "@/models/Message";
import { getAuthFromRequest } from "@/utils/getAuthFromRequest";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

/**
 * PATCH /api/messages/[id] — mark a message read/unread (recipient only).
 *
 * Body: `{ read: true | false }` — sets `read` explicitly (clearer REST than
 * the web action's toggle). Only the recipient may update this field.
 * Response: `{ read }`
 */
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getAuthFromRequest(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid message id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || typeof body.read !== "boolean") {
      return Response.json(
        { error: "Body must include read: true|false" },
        { status: 400 },
      );
    }

    const message = await Message.findById(id);
    if (!message) {
      return Response.json({ error: "Message not found." }, { status: 404 });
    }

    if (message.recipient.toString() !== String(session.user.id)) {
      return Response.json(
        { error: "Only the recipient can mark a message as read." },
        { status: 403 },
      );
    }

    message.read = body.read;
    await message.save();

    revalidatePath("/messages");

    return Response.json({ read: message.read });
  } catch (error) {
    console.error("PATCH /api/messages/[id]:", error);
    return Response.json(
      { error: "Failed to update message" },
      { status: 500 },
    );
  }
}
