"use client";

import { useState } from "react";
import Link from "next/link";
import { markMessageAsRead, deleteMessage } from "@/utils/actions/messageActions";

export default function MessageCard({ message, currentUserId }) {
  const [isRead, setIsRead] = useState(message.read);
  const [isDeleted, setIsDeleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSender = message.sender._id.toString() === currentUserId;
  const isRecipient = message.recipient._id.toString() === currentUserId;

  const otherParty = isSender ? message.recipient : message.sender;
  const avatar = otherParty?.image;
  const initials = (otherParty?.username || otherParty?.email || "?")
    .charAt(0)
    .toUpperCase();

  const handleToggleRead = async () => {
    setLoading(true);
    const result = await markMessageAsRead(message._id);
    if (result?.read !== undefined) setIsRead(result.read);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this message?")) return;
    setLoading(true);
    const result = await deleteMessage(message._id);
    if (result?.success) setIsDeleted(true);
    setLoading(false);
  };

  if (isDeleted) return null;

  return (
    <div
      className={`rounded-2xl border bg-white p-5 transition-all ${
        !isRead && isRecipient
          ? "border-blue-300 bg-blue-50/30"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={otherParty?.username}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
              {initials}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">
              {message.name}
            </span>
            {!isRead && isRecipient && (
              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
            )}
            {isSender && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                Sent
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-gray-400">
            {message.email}
            {message.phone && ` · ${message.phone}`}
          </p>

          {message.property && (
            <Link
              href={`/properties/${message.property._id}`}
              className="mt-1 inline-block text-xs text-blue-600 hover:underline"
            >
              Re: {message.property.name}
            </Link>
          )}

          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            {message.body}
          </p>

          <p className="mt-2 text-xs text-gray-400">
            {new Date(message.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {isRecipient && (
          <button
            onClick={handleToggleRead}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            {isRead ? "Mark Unread" : "Mark Read"}
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-xl border border-red-200 bg-white px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
