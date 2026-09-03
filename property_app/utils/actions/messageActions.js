"use server";

import connectToDatabase from "@/config/database";
import Message from "@/models/Message";
import Property from "@/models/Property";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { revalidatePath } from "next/cache";

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

  const propertyId = formData.get("propertyId");
  const recipientId = formData.get("recipientId");
  const name = formData.get("name")?.trim();
  const email = formData.get("email")?.trim();
  const phone = formData.get("phone")?.trim();
  const body = formData.get("body")?.trim();

  if (!propertyId || !recipientId || !name || !email || !body) {
    return { error: "Please fill in all required fields." };
  }

  if (session.user.id === recipientId) {
    return { error: "You cannot send a message to yourself." };
  }

  await Message.create({
    sender: session.user.id,
    recipient: recipientId,
    property: propertyId,
    name,
    email,
    phone: phone || undefined,
    body,
    read: false,
  });

  revalidatePath("/messages");
  revalidatePath(`/properties/${propertyId}`);
  const listed = await Property.findById(propertyId).select("slug").lean();
  if (listed?.slug) {
    revalidatePath(`/properties/${listed.slug}`);
  }

  return { success: "Message sent successfully!" };
}

/**
 * Reply in an existing property conversation (recipient → original sender).
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

  await Message.create({
    sender: userId,
    recipient: replyToUserId,
    property: parent.property,
    name: session.user.name || session.user.email || "User",
    email: session.user.email || "",
    body,
    read: false,
  });

  if (isRecipient && !parent.read) {
    parent.read = true;
    await parent.save();
  }

  revalidatePath("/messages");
  revalidatePath(`/properties/${parent.property.toString()}`);
  const listed = await Property.findById(parent.property).select("slug").lean();
  if (listed?.slug) {
    revalidatePath(`/properties/${listed.slug}`);
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

  return { success: "Message deleted." };
}
