"use server";

import connectToDatabase from "@/config/database";
import Message from "@/models/Message";
import Property from "@/models/Property";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { sendOpsMessageEmail } from "@/utils/email/sendOpsMessageEmail";

const MESSAGE_BODY_MAX = 4000;

function revalidateMessagePaths(propertyId) {
  revalidatePath("/messages");
  revalidatePath("/host/messages");
  if (!propertyId) return;
  revalidatePath(`/properties/${propertyId}`);
}

export async function getMessages() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return [];
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

  return JSON.parse(JSON.stringify(messages));
}

export async function getUnreadMessageCount() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return 0;

  const count = await Message.countDocuments({
    recipient: session.user.id,
    read: false,
  });

  return count;
}

export async function sendMessage(formData) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "You must be signed in to send a message." };
  }

  const propertyId = String(formData.get("propertyId") || "").trim();
  const recipientId = String(formData.get("recipientId") || "").trim();
  const name = formData.get("name")?.trim();
  const email = formData.get("email")?.trim();
  const phone = formData.get("phone")?.trim();
  const body = formData.get("body")?.trim();
  const opsAccountMessage = !propertyId && isOpsStaff(session.user.role);

  if (!recipientId || !name || !email || !body) {
    return { error: "Please fill in all required fields." };
  }

  if (!propertyId && !opsAccountMessage) {
    return { error: "Please fill in all required fields." };
  }

  if (body.length > MESSAGE_BODY_MAX) {
    return { error: "Message is too long." };
  }

  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    return { error: "Invalid recipient." };
  }

  if (propertyId && !mongoose.Types.ObjectId.isValid(propertyId)) {
    return { error: "Invalid listing." };
  }

  if (session.user.id === recipientId) {
    return { error: "You cannot send a message to yourself." };
  }

  const recipient = await User.findById(recipientId)
    .select("_id email username hostStatus")
    .lean();
  if (!recipient) {
    return { error: "User not found." };
  }

  await Message.create({
    sender: session.user.id,
    recipient: recipientId,
    ...(propertyId ? { property: propertyId } : {}),
    name,
    email,
    phone: phone || undefined,
    body,
    read: false,
  });

  revalidateMessagePaths(propertyId || null);
  let propertyName = "";
  if (propertyId) {
    const listed = await Property.findById(propertyId).select("slug name").lean();
    if (listed?.slug) {
      revalidatePath(`/properties/${listed.slug}`);
    }
    propertyName = listed?.name || "";
  }

  if (isOpsStaff(session.user.role)) {
    await sendOpsMessageEmail({
      recipientEmail: recipient.email,
      recipientName: recipient.username,
      hostStatus: recipient.hostStatus,
      body,
      propertyName,
    });
  }

  return { success: "Message sent successfully!" };
}

/**
 * Reply in an existing conversation (recipient → original sender).
 */
export async function replyToMessage(formData) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "You must be signed in to reply." };
  }

  const parentId = formData.get("messageId");
  const body = formData.get("body")?.trim();

  if (!parentId || !body) {
    return { error: "Please write a reply." };
  }

  if (body.length > MESSAGE_BODY_MAX) {
    return { error: "Message is too long." };
  }

  const parent = await Message.findById(parentId);
  if (!parent) {
    return { error: "Original message not found." };
  }

  const userId = session.user.id;
  const isRecipient = parent.recipient.toString() === userId;
  const isSender = parent.sender.toString() === userId;
  if (!isRecipient && !isSender) {
    return { error: "You are not part of this conversation." };
  }

  const replyToUserId = isRecipient
    ? parent.sender.toString()
    : parent.recipient.toString();

  if (replyToUserId === userId) {
    return { error: "You cannot reply to yourself." };
  }

  const parentPropertyId = parent.property ? parent.property.toString() : "";

  await Message.create({
    sender: userId,
    recipient: replyToUserId,
    ...(parentPropertyId ? { property: parentPropertyId } : {}),
    name: session.user.name || session.user.email || "User",
    email: session.user.email || "",
    body,
    read: false,
  });

  if (isRecipient && !parent.read) {
    parent.read = true;
    await parent.save();
  }

  revalidateMessagePaths(parentPropertyId || null);
  let propertyName = "";
  if (parentPropertyId) {
    const listed = await Property.findById(parentPropertyId)
      .select("slug name")
      .lean();
    if (listed?.slug) {
      revalidatePath(`/properties/${listed.slug}`);
    }
    propertyName = listed?.name || "";
  }

  if (isOpsStaff(session.user.role)) {
    const replyRecipient = await User.findById(replyToUserId)
      .select("email username hostStatus")
      .lean();
    await sendOpsMessageEmail({
      recipientEmail: replyRecipient?.email,
      recipientName: replyRecipient?.username,
      hostStatus: replyRecipient?.hostStatus,
      body,
      propertyName,
    });
  }

  return { success: "Reply sent." };
}

export async function markMessageAsRead(messageId) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized." };
  }

  const message = await Message.findById(messageId);

  if (!message) {
    return { error: "Message not found." };
  }

  if (message.recipient.toString() !== session.user.id) {
    return { error: "Only the recipient can mark a message as read." };
  }

  message.read = !message.read;
  await message.save();

  revalidatePath("/messages");
  revalidatePath("/host/messages");

  return { read: message.read };
}

export async function deleteMessage(messageId) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized." };
  }

  const message = await Message.findById(messageId);

  if (!message) {
    return { error: "Message not found." };
  }

  const userId = session.user.id;
  const isSender = message.sender.toString() === userId;
  const isRecipient = message.recipient.toString() === userId;

  if (!isSender && !isRecipient) {
    return { error: "You are not authorised to delete this message." };
  }

  await message.deleteOne();

  revalidatePath("/messages");
  revalidatePath("/host/messages");

  return { success: "Message deleted." };
}
