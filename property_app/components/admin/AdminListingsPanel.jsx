"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isOpsStaff } from "@/utils/opsAuth";
import AdminListingCardActions from "@/components/admin/AdminListingCardActions";

/**
 * Property listings moderation UI (shared by /ops/listings).
 * Includes View, Message host, and Delete (type-confirm) actions.
 */
export default function AdminListingsPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (status === "authenticated" && !isOpsStaff(session?.user?.role)) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !isOpsStaff(session?.user?.role)) return;

    const fetchListings = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/listings?status=${encodeURIComponent(filter)}&nc=${Date.now()}`,
          {
            cache: "no-store",
            credentials: "include",
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          },
        );
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = await res.json();
        setProperties(data.properties || []);
        if (data.counts) {
          setCounts({
            pending: Number(data.counts.pending) || 0,
            approved: Number(data.counts.approved) || 0,
            rejected: Number(data.counts.rejected) || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filter, session, status]);

  const handleAction = async (id, action) => {
    setActionLoading(String(id));
    try {
      const body = { status: action };
      if (action === "rejected") {
        const reason = window.prompt(
          "Optional rejection reason (shown to the host):",
          "Does not meet listing guidelines.",
        );
        if (reason === null) {
          return;
        }
        body.rejectionReason = reason.trim();
      }

      const idStr = String(id);
      const res = await fetch(`/api/admin/listings/${idStr}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server returned ${res.status}`);
      }

      const syncRes = await fetch(
        `/api/admin/listings?status=${encodeURIComponent(filter)}&nc=${Date.now()}`,
        {
          cache: "no-store",
          credentials: "include",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        },
      );
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setProperties(syncData.properties || []);
        if (syncData.counts) {
          setCounts({
            pending: Number(syncData.counts.pending) || 0,
            approved: Number(syncData.counts.approved) || 0,
            rejected: Number(syncData.counts.rejected) || 0,
          });
        }
      } else {
        setProperties((prev) => prev.filter((p) => String(p._id) !== idStr));
      }
    } catch (error) {
      console.error("handleAction error:", error);
      alert("Failed: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-12 text-center">
        <p className="mb-4 text-gray-700">Please sign in to access ops.</p>
        <Link
          href="/ops/login"
          className="rounded bg-gray-900 px-6 py-2 text-white transition hover:bg-gray-800"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!isOpsStaff(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-12 text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Access Denied</h1>
        <p className="mb-4 text-gray-600">
          You need admin privileges to view this page.
        </p>
        <Link
          href="/"
          className="rounded bg-gray-900 px-6 py-2 text-white transition hover:bg-gray-800"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-[1.75rem]">
          Property listings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          Approve to publish publicly, or reject with a reason for the host.
          Pending shows new submissions only; older listings stay under Approved.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {["pending", "approved", "rejected"].map((statusFilter) => (
          <button
            key={statusFilter}
            type="button"
            onClick={() => setFilter(statusFilter)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === statusFilter
                ? "bg-gray-900 text-white"
                : "border bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {statusFilter} ({counts[statusFilter] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center text-gray-500">
          No {filter} listings.
        </div>
      ) : (
        <ul className="space-y-4">
          {properties.map((property) => {
            const id = String(property._id);
            const busy = actionLoading === id;
            const ownerId = property.owner
              ? String(property.owner._id || property.owner)
              : "";
            const ownerLabel =
              property.ownerUser?.username ||
              property.ownerUser?.email ||
              property.seller_info?.email ||
              property.owner ||
              "—";

            let moderationButtons = null;
            if (filter === "pending") {
              moderationButtons = (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleAction(id, "approved")}
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {busy ? "…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleAction(id, "rejected")}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              );
            } else if (filter === "rejected") {
              moderationButtons = (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAction(id, "approved")}
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  Approve
                </button>
              );
            }

            return (
              <li
                key={id}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-gray-900">
                      {property.name || "Untitled"}
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {[property.location?.city, property.location?.country]
                        .filter(Boolean)
                        .join(", ") || "No location"}
                      {" · "}
                      <span className="capitalize">{property.type}</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Host: {ownerLabel}
                      {property.listingModerationRequestedAt
                        ? ` · Submitted ${new Date(
                            property.listingModerationRequestedAt,
                          ).toLocaleDateString()}`
                        : null}
                    </p>
                    {property.status === "rejected" &&
                      property.rejectionReason && (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                          {property.rejectionReason}
                        </p>
                      )}
                  </div>
                  <AdminListingCardActions
                    propertyId={id}
                    propertyName={property.name || "Untitled"}
                    ownerId={ownerId}
                    hostLabel={
                      typeof ownerLabel === "string" ? ownerLabel : "host"
                    }
                    moderationButtons={moderationButtons}
                    onDeleted={() => {
                      setProperties((prev) =>
                        prev.filter((p) => String(p._id) !== id),
                      );
                      setCounts((prev) => ({
                        ...prev,
                        [filter]: Math.max(0, (prev[filter] ?? 1) - 1),
                      }));
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
