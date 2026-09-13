"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Mail, Phone, X } from "lucide-react";
import { formatGuestDate } from "@/utils/availability/validateStay";
import {
  countNights,
  displayStatus,
  localTodayYmd,
} from "@/utils/host/reservationsCalendar";
import {
  guestPhoneTelHref,
  guestPhoneWhatsAppHref,
} from "@/utils/bookings/paymentMode";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import GuestAvatar from "./GuestAvatar";

function formatAmount(amount, currency) {
  if (amount == null || !currency) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
}

export default function ReservationDrawer({
  booking,
  properties = [],
  onClose,
  onChanged,
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const today = localTodayYmd();
  const status = displayStatus(booking, today);
  const nights = countNights(booking.checkIn, booking.checkOut);
  const amount = formatAmount(booking.amount, booking.currency);
  const [busy, setBusy] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmUnlist, setConfirmUnlist] = useState(false);
  const [confirmMove, setConfirmMove] = useState(false);
  const [moveTo, setMoveTo] = useState("");
  const [checkIn, setCheckIn] = useState(booking.checkIn);
  const [checkOut, setCheckOut] = useState(booking.checkOut);
  const [message, setMessage] = useState(null);
  const pid = booking.propertyId;
  const telHref = guestPhoneTelHref(booking.guestPhone);
  const waHref = guestPhoneWhatsAppHref(booking.guestPhone);

  useEffect(() => {
    setCheckIn(booking.checkIn);
    setCheckOut(booking.checkOut);
    setEditing(false);
    setConfirmCancel(false);
    setConfirmUnlist(false);
    setConfirmMove(false);
    setMoveTo("");
    setMessage(null);
  }, [booking._id, booking.checkIn, booking.checkOut, booking.listed, booking.propertyId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const run = async (label, fn) => {
    setBusy(label);
    setMessage(null);
    try {
      await fn();
      onChanged?.();
    } catch (e) {
      setMessage({ ok: false, text: e.message || t("hostConsole.bookings.requestFailed") });
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = () =>
    run("cancel", async () => {
      const res = await fetch(`/api/properties/${pid}/bookings/${booking._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: t("hostConsole.bookings.cancelReason") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("hostConsole.bookings.couldNotCancel"));
      setConfirmCancel(false);
      setMessage({ ok: true, text: t("hostConsole.bookings.reservationCancelled") });
    });

  const handleToggleListed = () => {
    const relist = booking.listed === false;
    run(relist ? "relist" : "unlist", async () => {
      const res = await fetch(`/api/properties/${pid}/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listed: relist }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ||
            (relist
              ? t("hostConsole.bookings.couldNotRelist")
              : t("hostConsole.bookings.couldNotUnlist")),
        );
      }
      setConfirmUnlist(false);
      setMessage({
        ok: true,
        text: relist
          ? t("hostConsole.bookings.reservationRelisted")
          : t("hostConsole.bookings.reservationUnlisted"),
      });
    });
  };

  const handleSaveDates = () =>
    run("modify", async () => {
      const res = await fetch(`/api/properties/${pid}/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("hostConsole.bookings.couldNotUpdateDates"));
      setEditing(false);
      setMessage({ ok: true, text: t("hostConsole.bookings.datesUpdated") });
    });

  const moveTargets = properties.filter(
    (p) => p.id && p.id !== String(booking.propertyId),
  );
  const canMove =
    Boolean(booking.actions?.modify?.allowed) &&
    booking.listed !== false &&
    booking.status !== "cancelled" &&
    booking.checkIn >= today &&
    moveTargets.length > 0;

  const handleMove = () => {
    if (!moveTo) return;
    run("move", async () => {
      const res = await fetch(`/api/properties/${pid}/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPropertyId: moveTo,
          version: booking.version,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("hostConsole.resCal.couldNotMove"));
      }
      const destName =
        data.destProperty?.name ||
        moveTargets.find((p) => p.id === moveTo)?.name ||
        "";
      setConfirmMove(false);
      setMoveTo("");
      setMessage({
        ok: true,
        text: t("hostConsole.resCal.moved", { name: destName }),
      });
    });
  };

  const statusLabel =
    status === "unlisted"
      ? t("hostConsole.resCal.status.unlisted")
      : status === "pending" && booking.paymentMode === "manual"
      ? t("hostConsole.bookings.awaitingPayment")
      : t(`hostConsole.resCal.status.${status}`);

  return (
    <>
      <button
        type="button"
        className="rc-scrim"
        aria-label={t("hostConsole.resCal.close")}
        onClick={onClose}
      />
      <aside
        className="rc-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="rc-drawer__top">
          <div>
            <p className="rc-drawer__kicker">{t("hostConsole.resCal.kicker")}</p>
            <p className="rc-drawer__ref" id={titleId}>
              {booking.transactionId
                ? `${t("hostConsole.resCal.reservation")} #${booking.transactionId}`
                : t("hostConsole.resCal.reservation")}
            </p>
          </div>
          <button
            type="button"
            className="rc-btn rc-btn--ghost"
            onClick={onClose}
            aria-label={t("hostConsole.resCal.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rc-drawer__body">
          <div className="rc-guest">
            <GuestAvatar
              large
              name={booking.guestName}
              src={booking.guestImage}
            />
            <h3>{booking.guestName || t("hostConsole.guest")}</h3>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--kama-ink-muted)]">
              {t("hostConsole.guest")}
            </p>
            {booking.guestEmail ? (
              <a className="inline-flex items-center gap-1.5" href={`mailto:${booking.guestEmail}`}>
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {booking.guestEmail}
              </a>
            ) : null}
            {booking.guestPhone ? (
              <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[var(--kama-ink-muted)]" aria-hidden />
                  {telHref ? <a href={telHref}>{booking.guestPhone}</a> : booking.guestPhone}
                </span>
                {waHref ? (
                  <a href={waHref} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className="rc-stay">
            <h4>{booking.propertyName || t("hostConsole.stay")}</h4>
            <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
              {formatGuestDate(booking.checkIn)} → {formatGuestDate(booking.checkOut)}
            </p>
            <p className="mt-1 text-sm font-semibold">
              {t(
                nights === 1
                  ? "hostConsole.bookings.nightOne"
                  : "hostConsole.bookings.nightOther",
                { n: nights },
              )}
            </p>

            <div className="rc-kv">
              <div>
                <span>{t("hostConsole.bookings.checkIn")}</span>
                {formatGuestDate(booking.checkIn)}
              </div>
              <div>
                <span>{t("hostConsole.bookings.checkOut")}</span>
                {formatGuestDate(booking.checkOut)}
              </div>
              <div>
                <span>{t("hostConsole.resCal.statusLabel")}</span>
                {statusLabel}
              </div>
              {booking.createdAt ? (
                <div>
                  <span>{t("hostConsole.resCal.bookedOn")}</span>
                  {new Date(booking.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              ) : null}
              {booking.transactionId ? (
                <div>
                  <span>{t("hostConsole.resCal.number")}</span>
                  #{booking.transactionId}
                </div>
              ) : null}
              {amount ? (
                <div>
                  <span>{t("hostConsole.resCal.total")}</span>
                  {amount}
                </div>
              ) : null}
            </div>
          </div>

          {editing ? (
            <div className="rc-dates mb-3">
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          ) : null}

          {message ? (
            <p
              className={`mb-3 text-sm ${
                message.ok ? "text-[var(--kama-accent)]" : "text-[var(--kama-danger)]"
              }`}
            >
              {message.text}
            </p>
          ) : null}

          <div className="rc-actions">
            <Link
              href={`/properties/${pid}/reservations`}
              className="rc-btn rc-btn--accent"
            >
              {t("hostConsole.resCal.viewReservation")}
            </Link>
            {booking.actions?.modify?.allowed ? (
              editing ? (
                <button
                  type="button"
                  className="rc-btn"
                  disabled={busy === "modify"}
                  onClick={handleSaveDates}
                >
                  {busy === "modify"
                    ? t("hostConsole.bookings.saving")
                    : t("hostConsole.bookings.saveDates")}
                </button>
              ) : (
                <button
                  type="button"
                  className="rc-btn"
                  onClick={() => setEditing(true)}
                >
                  {t("hostConsole.resCal.modify")}
                </button>
              )
            ) : null}
            {booking.status !== "cancelled" ? (
              confirmUnlist && booking.listed !== false ? (
                <div className="rc-confirm">
                  <p>{t("hostConsole.resCal.unlistAsk")}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="rc-btn"
                      disabled={busy === "unlist"}
                      onClick={handleToggleListed}
                    >
                      {busy === "unlist"
                        ? t("hostConsole.resCal.unlisting")
                        : t("hostConsole.resCal.confirmUnlist")}
                    </button>
                    <button
                      type="button"
                      className="rc-btn"
                      onClick={() => setConfirmUnlist(false)}
                    >
                      {t("hostConsole.cal.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="rc-btn"
                  disabled={busy === "unlist" || busy === "relist"}
                  onClick={() => {
                    if (booking.listed === false) handleToggleListed();
                    else setConfirmUnlist(true);
                  }}
                >
                  {busy === "unlist"
                    ? t("hostConsole.resCal.unlisting")
                    : busy === "relist"
                      ? t("hostConsole.resCal.relisting")
                      : booking.listed === false
                        ? t("hostConsole.resCal.relist")
                        : t("hostConsole.resCal.unlist")}
                </button>
              )
            ) : null}
            {canMove ? (
              confirmMove ? (
                <div className="rc-confirm">
                  <p>{t("hostConsole.resCal.moveHint")}</p>
                  <label className="mt-2 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
                    {t("hostConsole.resCal.moveTo")}
                    <select
                      className="mt-1 w-full rounded-lg border border-[var(--kama-border)] bg-[var(--kama-surface)] px-2 py-2 text-sm font-medium text-[var(--kama-ink)]"
                      value={moveTo}
                      onChange={(e) => setMoveTo(e.target.value)}
                    >
                      <option value="">{t("hostConsole.resCal.chooseListing")}</option>
                      {moveTargets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="rc-btn rc-btn--accent"
                      disabled={busy === "move" || !moveTo}
                      onClick={handleMove}
                    >
                      {busy === "move"
                        ? t("hostConsole.resCal.moving")
                        : t("hostConsole.resCal.confirmMove")}
                    </button>
                    <button
                      type="button"
                      className="rc-btn"
                      onClick={() => {
                        setConfirmMove(false);
                        setMoveTo("");
                      }}
                    >
                      {t("hostConsole.cal.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="rc-btn"
                  onClick={() => setConfirmMove(true)}
                >
                  {t("hostConsole.resCal.move")}
                </button>
              )
            ) : null}
            {booking.actions?.cancel?.allowed ? (
              confirmCancel ? (
                <div className="rc-confirm">
                  <p>{t("hostConsole.resCal.cancelAsk")}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="rc-btn rc-btn--danger"
                      disabled={busy === "cancel"}
                      onClick={handleCancel}
                    >
                      {busy === "cancel"
                        ? t("hostConsole.bookings.cancelling")
                        : t("hostConsole.resCal.confirmCancel")}
                    </button>
                    <button
                      type="button"
                      className="rc-btn"
                      onClick={() => setConfirmCancel(false)}
                    >
                      {t("hostConsole.cal.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="rc-btn rc-btn--danger"
                  onClick={() => setConfirmCancel(true)}
                >
                  {t("hostConsole.resCal.cancel")}
                </button>
              )
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
