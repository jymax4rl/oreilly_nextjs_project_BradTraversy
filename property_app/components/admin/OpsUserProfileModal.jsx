"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Ban,
  IdCard,
  MessageCircle,
  ShieldOff,
  UserRound,
  X,
} from "lucide-react";
import { formatAddress } from "@/utils/address";
import AdminMessageHostModal from "./AdminMessageHostModal";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-gray-900">
        {children || "—"}
      </dd>
    </div>
  );
}

/**
 * Ops-only modal: user profile, host ID verification, ban/unban, optional message.
 * Stays in ops chrome — does not navigate to /profile.
 */
export default function OpsUserProfileModal({
  open,
  userId,
  onClose,
  onUserUpdated,
}) {
  const titleId = useId();
  const closeRef = useRef(null);
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [banBusy, setBanBusy] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [messageOpen, setMessageOpen] = useState(false);

  const load = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error((await res.text()) || `Failed (${res.status})`);
      }
      const data = await res.json();
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !userId) {
      setPayload(null);
      setError(null);
      setLightboxUrl(null);
      setMessageOpen(false);
      setBanBusy(false);
      return;
    }

    load(userId);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeRef.current?.focus(), 50);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, userId, load]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (lightboxUrl) {
        setLightboxUrl(null);
        return;
      }
      if (!banBusy && !messageOpen) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, lightboxUrl, banBusy, messageOpen, onClose]);

  if (!open) return null;

  const user = payload?.user;
  const app = payload?.hostApplication;
  const idUrls = app?.idDocumentUrls || [];
  const isBanned = Boolean(user?.banned);
  const canBanTarget =
    Boolean(userId) &&
    String(session?.user?.id) !== String(userId) &&
    user?.role !== "admin" &&
    user?.role !== "superadmin";

  const messageContext = payload?.messageContext;
  const canMessage =
    Boolean(messageContext?.propertyId) &&
    Boolean(userId) &&
    Boolean(session?.user?.id) &&
    String(session.user.id) !== String(userId);

  const senderName =
    session?.user?.name || session?.user?.email || "Kama Ops";
  const senderEmail = session?.user?.email || "";

  const handleBanToggle = async () => {
    if (!canBanTarget || banBusy || !user) return;

    if (!isBanned) {
      const ok = window.confirm(
        `Ban ${user.username || user.email}? They will not be able to sign in.`,
      );
      if (!ok) return;
      const reason = window.prompt("Ban reason (optional):") || "";
      setBanBusy(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/users/${encodeURIComponent(userId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ banned: true, reason }),
          },
        );
        if (!res.ok) {
          throw new Error((await res.text()) || "Ban failed");
        }
        const data = await res.json();
        setPayload((prev) =>
          prev
            ? {
                ...prev,
                user: {
                  ...prev.user,
                  banned: true,
                  bannedAt: data.bannedAt,
                  bannedReason: data.bannedReason,
                },
              }
            : prev,
        );
        onUserUpdated?.({
          userId: String(userId),
          banned: true,
          bannedAt: data.bannedAt,
          bannedReason: data.bannedReason,
        });
      } catch (err) {
        setError(err.message || "Ban failed");
      } finally {
        setBanBusy(false);
      }
      return;
    }

    const ok = window.confirm(
      `Unban ${user.username || user.email}? They will be able to sign in again.`,
    );
    if (!ok) return;

    setBanBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ banned: false }),
        },
      );
      if (!res.ok) {
        throw new Error((await res.text()) || "Unban failed");
      }
      setPayload((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                banned: false,
                bannedAt: null,
                bannedReason: null,
              },
            }
          : prev,
      );
      onUserUpdated?.({
        userId: String(userId),
        banned: false,
        bannedAt: null,
        bannedReason: null,
      });
    } catch (err) {
      setError(err.message || "Unban failed");
    } finally {
      setBanBusy(false);
    }
  };

  return (
    <>
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
          disabled={banBusy}
          onClick={() => !banBusy && onClose?.()}
        />

        <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B5C57]/10 text-[#1B5C57]">
                <UserRound size={20} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-lg font-semibold text-gray-900"
                >
                  User profile
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ops view · sensitive ID data stays in this console
                </p>
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={() => !banBusy && onClose?.()}
              disabled={banBusy}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              aria-label="Close"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="space-y-5 overflow-y-auto px-5 py-4">
            {loading && (
              <div className="flex justify-center py-10">
                <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-[#1B5C57]" />
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

            {!loading && user && (
              <>
                <div className="flex items-center gap-4">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt=""
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-[#1B5C57]/20"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-600">
                      {user.username?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-gray-900">
                      {user.username || "Unknown"}
                    </p>
                    <p className="truncate text-sm text-gray-500">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-800">
                        {user.role || "guest"}
                      </span>
                      <span className="rounded-full bg-[#1B5C57]/10 px-2.5 py-0.5 text-xs font-medium capitalize text-[#1B5C57]">
                        host: {user.hostStatus || "none"}
                      </span>
                      {isBanned ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                          Banned
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Joined">{formatDate(user.createdAt)}</Field>
                  <Field label="Listings">
                    {payload?.stats?.listingCount ?? 0}
                  </Field>
                  {user.hostAddress && (
                    <div className="sm:col-span-2">
                      <Field label="Host address">
                        {formatAddress(user.hostAddress)}
                      </Field>
                    </div>
                  )}
                  {isBanned && (
                    <>
                      <Field label="Banned on">{formatDate(user.bannedAt)}</Field>
                      <Field label="Ban reason">
                        {user.bannedReason || "—"}
                      </Field>
                    </>
                  )}
                </dl>

                <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                  <div className="mb-3 flex items-center gap-2 text-[#1B5C57]">
                    <IdCard size={18} aria-hidden />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Host verification ID
                    </h3>
                  </div>
                  {!app ? (
                    <p className="text-sm text-gray-500">
                      No host application on file.
                    </p>
                  ) : (
                    <>
                      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Application status">
                          <span className="capitalize">{app.status}</span>
                        </Field>
                        <Field label="Phone">{app.phone}</Field>
                        <Field label="ID type">
                          <span className="capitalize">
                            {String(app.idType || "").replace(/_/g, " ")}
                          </span>
                        </Field>
                        <Field label="ID number">{app.idNumber}</Field>
                        <Field label="Submitted">
                          {formatDate(app.createdAt)}
                        </Field>
                      </dl>
                      {app.bio ? (
                        <p className="mt-3 text-sm text-gray-700">{app.bio}</p>
                      ) : null}

                      <div className="mt-4">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                          ID document images
                        </p>
                        {idUrls.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No ID images stored for this application.
                          </p>
                        ) : (
                          <ul className="flex flex-wrap gap-2">
                            {idUrls.map((url) => (
                              <li key={url}>
                                <button
                                  type="button"
                                  onClick={() => setLightboxUrl(url)}
                                  className="block overflow-hidden rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5C57]/40"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt="Host ID document"
                                    className="h-24 w-36 object-cover"
                                  />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={() => onClose?.()}
              disabled={banBusy}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Close
            </button>

            {canMessage && (
              <button
                type="button"
                onClick={() => setMessageOpen(true)}
                disabled={banBusy || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1B5C57]/30 bg-[#1B5C57]/5 px-4 py-2.5 text-sm font-semibold text-[#1B5C57] transition hover:bg-[#1B5C57]/10 disabled:opacity-50"
              >
                <MessageCircle size={16} aria-hidden />
                Message user
              </button>
            )}

            {canBanTarget && user && (
              <button
                type="button"
                onClick={handleBanToggle}
                disabled={banBusy || loading}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  isBanned
                    ? "bg-[#1B5C57] hover:bg-[#164e4a]"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isBanned ? (
                  <ShieldOff size={16} aria-hidden />
                ) : (
                  <Ban size={16} aria-hidden />
                )}
                {banBusy
                  ? "Working…"
                  : isBanned
                    ? "Unban user"
                    : "Ban user"}
              </button>
            )}
          </div>
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[320] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="ID document preview"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close preview"
            onClick={() => setLightboxUrl(null)}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Host ID document full size"
            className="relative z-10 max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 rounded-lg bg-white/90 p-2 text-gray-800 hover:bg-white"
            aria-label="Close preview"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      )}

      <AdminMessageHostModal
        open={messageOpen}
        propertyId={messageContext?.propertyId}
        recipientId={userId ? String(userId) : ""}
        propertyName={messageContext?.propertyName}
        hostLabel={user?.username || user?.email}
        senderName={senderName}
        senderEmail={senderEmail}
        onClose={() => setMessageOpen(false)}
      />
    </>
  );
}
