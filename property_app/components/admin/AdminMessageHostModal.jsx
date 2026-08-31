"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { sendMessage } from "@/utils/actions/messageActions";

/**
 * Ops modal: send an in-app Message to the listing owner as the signed-in staff user.
 */
export default function AdminMessageHostModal({
  open,
  propertyId,
  recipientId,
  propertyName,
  hostLabel,
  senderName,
  senderEmail,
  onClose,
}) {
  const titleId = useId();
  const bodyId = useId();
  const bodyRef = useRef(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const canSend =
    Boolean(body.trim()) &&
    Boolean(propertyId) &&
    Boolean(recipientId) &&
    Boolean(senderName?.trim()) &&
    Boolean(senderEmail?.trim()) &&
    !sending;

  useEffect(() => {
    if (!open) {
      setBody("");
      setError(null);
      setSent(false);
      setSending(false);
      return;
    }
    const t = setTimeout(() => bodyRef.current?.focus(), 50);
    const onKey = (e) => {
      if (e.key === "Escape" && !sending) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, sending, onClose]);

  if (!open) return null;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("propertyId", propertyId);
      formData.set("recipientId", recipientId);
      formData.set("name", senderName.trim());
      formData.set("email", senderEmail.trim());
      formData.set("body", body.trim());

      const result = await sendMessage(formData);
      if (result?.error) {
        throw new Error(result.error);
      }
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        disabled={sending}
        onClick={() => !sending && onClose?.()}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B5C57]/10 text-[#1B5C57]">
              <MessageCircle size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-lg font-semibold text-gray-900"
              >
                Message host
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Sent as you via in-app messaging
                {hostLabel ? ` · to ${hostLabel}` : ""}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !sending && onClose?.()}
            disabled={sending}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Cancel"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {propertyName && (
            <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-800">
              {propertyName}
            </p>
          )}

          {sent ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Message sent. The host will see it under Messages.
            </p>
          ) : (
            <div>
              <label
                htmlFor={bodyId}
                className="block text-sm font-medium text-gray-800"
              >
                Message
              </label>
              <textarea
                ref={bodyRef}
                id={bodyId}
                rows={5}
                value={body}
                disabled={sending}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a note to the host about this listing…"
                className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20 disabled:opacity-60"
              />
            </div>
          )}

          {error && (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onClose?.()}
            disabled={sending}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {sent ? "Close" : "Cancel"}
          </button>
          {!sent && (
            <button
              type="button"
              disabled={!canSend}
              onClick={handleSend}
              className="rounded-xl bg-[#1B5C57] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#164e4a] disabled:cursor-not-allowed disabled:bg-[#1B5C57]/40 disabled:hover:bg-[#1B5C57]/40"
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
