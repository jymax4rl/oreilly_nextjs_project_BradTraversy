import connectToDatabase from "@/config/database";
import Message from "@/models/Message";
import { getAuthFromRequest } from "@/utils/getAuthFromRequest";
import { toMessageDTO } from "@/utils/messages/messageDto";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

/**
 * PATCH /api/messages/[id] — mark as read (CONTRACT v1).
 *
 * Body: `{ read: true }` only in this slice.
 * Only the recipient may mark read → 403; missing → 404.
 * Response: `{ message: MessageDTO }`
 */
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getAuthFromRequest(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid message id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || body.read !== true) {
      return Response.json(
        { error: "Body must be { read: true }" },
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

    message.read = true;
    await message.save();

    revalidatePath("/messages");

    return Response.json({ message: toMessageDTO(message) });
  } catch (error) {
    console.error("PATCH /api/messages/[id]:", error);
    return Response.json(
      { error: "Failed to update message" },
      { status: 500 },
    );
  }
}
