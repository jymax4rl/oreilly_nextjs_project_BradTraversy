"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminListingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
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
        const res = await fetch(`/api/admin/listings?status=${filter}`);
        const data = await res.json();
        setProperties(data.properties || []);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filter, session, status]);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const body = { status: action };
      if (action === "rejected") {
        const reason = window.prompt("Enter rejection reason (optional):");
        if (reason) body.rejectionReason = reason;
      }

      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server returned ${res.status}`);
      }

      setProperties((prev) => prev.filter((p) => p._id !== id));
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h1>
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
    <section className="min-h-screen bg-gray-50 py-12">
      <div className="container m-auto max-w-6xl px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Property listings
            </h1>
            <p className="text-gray-600 mt-1">
              Approve or reject new listings before they appear on the site
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
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                filter === statusFilter
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border"
              }`}
            >
              {statusFilter}
              {filter === statusFilter && properties.length > 0 && (
                <span className="ml-2 bg-white text-gray-900 text-xs px-2 py-0.5 rounded-full">
                  {properties.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-500 text-lg">
              No {filter} listings found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((prop) => (
              <div
                key={prop._id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-800 text-lg truncate">
                        {prop.name || "Untitled listing"}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                        {prop.type}
                      </span>
                      {filter === "approved" && !prop.listingStatus && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          Legacy (pre-moderation)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {[prop.location?.city, prop.location?.country]
                        .filter(Boolean)
                        .join(", ") || "Location not set"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Host:</span>{" "}
                        <span className="font-medium">
                          {prop.ownerUser?.username ||
                            prop.ownerUser?.email ||
                            prop.owner ||
                            "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Submitted:</span>{" "}
                        <span className="font-medium">
                          {prop.createdAt
                            ? new Date(prop.createdAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                    </div>
                    {prop.listingRejectionReason && filter === "rejected" && (
                      <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
                        <span className="font-medium">Rejection reason:</span>{" "}
                        {prop.listingRejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 items-stretch sm:items-start shrink-0">
                    <Link
                      href={`/properties/${prop._id}`}
                      className="text-center px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                    >
                      View listing
                    </Link>
                    {filter !== "approved" && (
                      <button
                        type="button"
                        onClick={() => handleAction(prop._id, "approved")}
                        disabled={actionLoading === prop._id}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50 text-sm"
                      >
                        {actionLoading === prop._id
                          ? "Processing..."
                          : "Approve"}
                      </button>
                    )}
                    {filter !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => handleAction(prop._id, "rejected")}
                        disabled={actionLoading === prop._id}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50 text-sm"
                      >
                        {actionLoading === prop._id
                          ? "Processing..."
                          : "Reject"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
