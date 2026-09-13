"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { isOpsStaff } from "@/utils/opsAuth";
import { propertyPublicPath } from "@/utils/listings/propertyPath";

const STATUS_OPTIONS = [
  { value: "new", label: "New (pending)" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All reservations" },
];

function formatStay(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "—";
  return `${checkIn} → ${checkOut}`;
}

function formatAmount(amount, currency) {
  if (amount == null || !currency) return "—";
  return `${currency} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function emailBadge(status) {
  if (status === "sent") return "text-emerald-700 bg-emerald-50";
  if (status === "failed") return "text-red-700 bg-red-50";
  if (status === "opted_out") return "text-slate-600 bg-slate-100";
  return "text-amber-800 bg-amber-50";
}

export default function OpsReservationsPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reservations, setReservations] = useState([]);
  const [counts, setCounts] = useState({
    new: 0,
    confirmed: 0,
    cancelled: 0,
    all: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "new",
  );
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [resendingId, setResendingId] = useState(null);
  const propertyId = searchParams.get("propertyId") || "";

  useEffect(() => {
    if (status === "authenticated" && !isOpsStaff(session?.user?.role)) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(searchInput.trim()), 320);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (status !== "authenticated" || !isOpsStaff(session?.user?.role)) return;

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ status: statusFilter });
        if (searchQuery) params.set("q", searchQuery);
        if (propertyId) params.set("propertyId", propertyId);
        const res = await fetch(
          `/api/ops/reservations?${params}&nc=${Date.now()}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setReservations(Array.isArray(data.reservations) ? data.reservations : []);
        if (data.counts) {
          setCounts({
            new: Number(data.counts.new) || 0,
            confirmed: Number(data.counts.confirmed) || 0,
            cancelled: Number(data.counts.cancelled) || 0,
            all: Number(data.counts.all) || 0,
          });
        }
      } catch (error) {
        console.error("Ops reservations:", error);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [statusFilter, searchQuery, propertyId, session, status]);

  const handleResend = async (bookingId) => {
    setResendingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/resend-confirmation`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not resend");
      setReservations((prev) =>
        prev.map((row) =>
          row._id === bookingId
            ? {
                ...row,
                emailStatus: {
                  ...(row.emailStatus || {}),
                  confirmedGuest: data.emails?.guestStatus,
                  confirmedHost: data.emails?.hostStatus,
                  lastError:
                    data.emails?.guestError || data.emails?.hostError || null,
                },
              }
            : row,
        ),
      );
    } catch (error) {
      alert(error.message || "Could not resend emails");
    } finally {
      setResendingId(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (status === "unauthenticated" || !isOpsStaff(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-12 text-center">
        <p className="mb-4 text-gray-700">Please sign in as admin.</p>
        <Link
          href="/ops/login"
          className="rounded bg-gray-900 px-6 py-2 text-white transition hover:bg-gray-800"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-[1.45rem] font-semibold tracking-tight text-[var(--kama-ink)] sm:text-[1.75rem]">
          Reservations
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          New requests land here as pending. Search by guest, host, listing, or
          reservation reference. Email status shows whether guest and host
          confirmation mail went out.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="ops-reservations-status">
          Reservation status
        </label>
        <select
          id="ops-reservations-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-lg border border-[var(--kama-border-strong)] bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
              {opt.value === "new" ? ` (${counts.new})` : ""}
              {opt.value === "all" ? ` (${counts.all})` : ""}
            </option>
          ))}
        </select>

        <div className="relative min-w-0 flex-1">
          <span
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--kama-ink-muted)]"
            aria-hidden
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M20 20l-3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search guest, host, listing, phone, or ref…"
            className="h-11 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white pl-10 pr-3 text-sm text-[var(--kama-ink)] outline-none placeholder:text-gray-400 focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20"
          />
        </div>
      </div>

      {propertyId ? (
        <p className="mb-4 text-xs text-gray-500">
          Filtered to one listing.{" "}
          <Link href="/ops/reservations" className="font-semibold text-[#1B5C57]">
            Show all
          </Link>
        </p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center text-gray-500">
          {searchQuery
            ? "No reservations match your search."
            : "No reservations in this view."}
        </div>
      ) : (
        <ul className="space-y-3">
          {reservations.map((row) => {
            const guestMail = row.emailStatus?.confirmedGuest || "—";
            const hostMail = row.emailStatus?.confirmedHost || "—";
            const mailFailed =
              guestMail === "failed" || hostMail === "failed";
            return (
              <li
                key={row._id}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      {row.guestName || row.guestEmail || "Guest"}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {row.propertyName}
                      {row.propertyLocation ? ` · ${row.propertyLocation}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatStay(row.checkIn, row.checkOut)}
                      {" · "}
                      {formatAmount(row.amount, row.currency)}
                      {" · "}
                      Host: {row.hostName || row.hostEmail || "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        {row.status}
                      </span>
                      {row.paymentMode === "manual" ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                          Offline pay
                        </span>
                      ) : null}
                      {row.source === "ops_training" ? (
                        <span className="rounded-full bg-[#1B5C57]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1B5C57]">
                          Training
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${emailBadge(guestMail)}`}
                      >
                        Guest mail {guestMail}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${emailBadge(hostMail)}`}
                      >
                        Host mail {hostMail}
                      </span>
                    </div>
                    {row.emailStatus?.lastError ? (
                      <p className="mt-2 text-xs text-red-700">
                        {row.emailStatus.lastError}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link
                      href={propertyPublicPath({
                        _id: row.propertyId,
                        slug: undefined,
                      })}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Listing
                    </Link>
                    {(mailFailed || guestMail === "—" || hostMail === "—") &&
                    row.status !== "cancelled" ? (
                      <button
                        type="button"
                        disabled={resendingId === row._id}
                        onClick={() => handleResend(row._id)}
                        className="rounded-lg bg-[#1B5C57] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#164a46] disabled:opacity-60"
                      >
                        {resendingId === row._id ? "Sending…" : "Resend emails"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
