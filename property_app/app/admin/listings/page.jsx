"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminListingsPage() {
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
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return;

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-700">Please sign in to access admin.</p>
          <Link
            href="/api/auth/signin"
            className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You need admin privileges to view this page.
          </p>
          <Link
            href="/"
            className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 py-12 pt-[7.75rem] lg:pt-12">
      <div className="container m-auto max-w-6xl px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Property listings
            </h1>
            <p className="text-gray-600 mt-1">
              Approve to publish publicly, or reject with a reason for the host.
              Pending shows new submissions only; older listings stay under Approved.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/hosts"
              className="bg-white border text-gray-700 hover:bg-gray-100 px-4 py-2 rounded transition font-medium"
            >
              Host applications
            </Link>
            <Link
              href="/admin/transactions"
              className="bg-white border text-gray-700 hover:bg-gray-100 px-4 py-2 rounded transition font-medium"
            >
              Transactions
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {["pending", "approved", "rejected"].map((statusFilter) => (
            <button
              key={statusFilter}
              type="button"
              onClick={() => setFilter(statusFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                filter === statusFilter
                  ? "bg-gray-900 text-white"
                  : "bg-white border text-gray-700 hover:bg-gray-50"
              }`}
            >
              {statusFilter} ({counts[statusFilter] ?? 0})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border bg-white px-6 py-14 text-center text-gray-500">
            No {filter} listings.
          </div>
        ) : (
          <ul className="space-y-4">
            {properties.map((property) => {
              const id = String(property._id);
              const busy = actionLoading === id;
              const ownerLabel =
                property.ownerUser?.username ||
                property.ownerUser?.email ||
                property.seller_info?.email ||
                property.owner ||
                "—";

              return (
                <li
                  key={id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 truncate">
                        {property.name || "Untitled"}
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {[property.location?.city, property.location?.country]
                          .filter(Boolean)
                          .join(", ") || "No location"}
                        {" · "}
                        <span className="capitalize">{property.type}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Host: {ownerLabel}
                        {property.listingModerationRequestedAt
                          ? ` · Submitted ${new Date(
                              property.listingModerationRequestedAt,
                            ).toLocaleDateString()}`
                          : null}
                      </p>
                      {property.status === "rejected" &&
                        property.rejectionReason && (
                          <p className="mt-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
                            {property.rejectionReason}
                          </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link
                        href={`/properties/${id}`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </Link>
                      {filter === "pending" && (
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
                      )}
                      {filter === "rejected" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleAction(id, "approved")}
                          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
