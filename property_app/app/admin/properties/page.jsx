"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function AdminPropertiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);
  const [migrating, setMigrating] = useState(false);

  const runMigration = async () => {
    if (!window.confirm('This will mark all properties without a status as "approved". Continue?')) return;
    setMigrating(true);
    try {
      const res = await fetch("/api/admin/migrate-property-status", { method: "POST" });
      const data = await res.json();
      alert(data.message || "Migration complete.");
      // Reload current tab
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert("Migration failed: " + err.message);
    } finally {
      setMigrating(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return;

    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/properties?status=${filter}`);
        const data = await res.json();
        setProperties(data.properties || []);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filter, session, status, refreshKey]);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const body = { status: action };
      if (action === "rejected") {
        const reason = window.prompt("Enter rejection reason (optional):");
        if (reason) body.rejectionReason = reason;
      }

      const res = await fetch(`/api/admin/properties/${id}`, {
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to view this page.</p>
          <Link href="/" className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const statusBadgeClass = (s) => {
    if (s === "approved") return "bg-green-100 text-green-800";
    if (s === "rejected") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <section className="min-h-screen bg-gray-50 py-12">
      <div className="container m-auto max-w-6xl px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Property Listings</h1>
            <p className="text-gray-600 mt-1">Review and approve or reject property submissions</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={runMigration}
              disabled={migrating}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded transition font-medium disabled:opacity-50 text-sm"
              title="Stamp all un-tagged properties as approved (one-time migration)"
            >
              {migrating ? "Running..." : "Run Status Migration"}
            </button>
            <Link
              href="/admin/hosts"
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded transition font-medium"
            >
              Host Applications
            </Link>
            <Link
              href="/admin/transactions"
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded transition font-medium"
            >
              Transactions
            </Link>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6">
          {["pending", "approved", "rejected"].map((statusFilter) => (
            <button
              key={statusFilter}
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
            <p className="text-gray-500 text-lg">No {filter} properties found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div
                key={property._id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Property image thumbnail */}
                  <div className="flex gap-4 flex-1">
                    {property.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/images/properties/${property.images[0]}`}
                        alt={property.name}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-800 text-lg truncate">{property.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(property.status || "pending")}`}>
                          {property.status || "pending"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-2">
                        <div>
                          <span className="text-gray-500">Type:</span>{" "}
                          <span className="font-medium capitalize">{property.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>{" "}
                          <span className="font-medium">
                            {[property.location?.city, property.location?.country].filter(Boolean).join(", ") || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Beds / Baths:</span>{" "}
                          <span className="font-medium">{property.beds} bed · {property.baths} bath</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Submitted:</span>{" "}
                          <span className="font-medium">{new Date(property.createdAt).toLocaleDateString()}</span>
                        </div>
                        {property.rates?.nightly && (
                          <div>
                            <span className="text-gray-500">Nightly rate:</span>{" "}
                            <span className="font-medium">${property.rates.nightly}</span>
                          </div>
                        )}
                        {property.seller_info?.name && (
                          <div>
                            <span className="text-gray-500">Host contact:</span>{" "}
                            <span className="font-medium">{property.seller_info.name}</span>
                          </div>
                        )}
                      </div>

                      {property.description && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{property.description}</p>
                      )}

                      {property.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
                          <span className="font-medium">Rejection reason:</span> {property.rejectionReason}
                        </div>
                      )}

                      <div className="mt-2">
                        <Link
                          href={`/properties/${property._id}`}
                          target="_blank"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View listing →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex lg:flex-col gap-2 items-start flex-shrink-0">
                    {filter !== "pending" && property.reviewedAt && (
                      <p className="text-xs text-gray-400 mb-1">
                        Reviewed {new Date(property.reviewedAt).toLocaleDateString()}
                      </p>
                    )}

                    {filter !== "approved" && (
                      <button
                        onClick={() => handleAction(property._id, "approved")}
                        disabled={actionLoading === property._id}
                        className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
                      >
                        {actionLoading === property._id ? "Processing..." : "Approve"}
                      </button>
                    )}

                    {filter !== "rejected" && (
                      <button
                        onClick={() => handleAction(property._id, "rejected")}
                        disabled={actionLoading === property._id}
                        className="w-full lg:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
                      >
                        {actionLoading === property._id ? "Processing..." : "Reject"}
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
