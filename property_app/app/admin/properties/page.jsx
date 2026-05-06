"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPropertiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);
  const [migrationLoading, setMigrationLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  const fetchProperties = async (statusFilter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/properties?status=${statusFilter}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error("Failed to fetch admin properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return;
    fetchProperties(filter);
  }, [filter, session, status]);

  const handleAction = async (id, nextStatus) => {
    const idStr = String(id);
    setActionLoading(idStr);
    try {
      const body = { status: nextStatus };
      if (nextStatus === "rejected") {
        const reason = window.prompt("Enter rejection reason (optional):");
        if (reason !== null && reason.trim()) {
          body.rejectionReason = reason.trim();
        }
      }

      const res = await fetch(`/api/admin/properties/${idStr}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error((await res.text()) || `Server returned ${res.status}`);
      }

      await fetchProperties(filter);
    } catch (error) {
      console.error("Failed to update property status:", error);
      alert("Failed to update property status");
    } finally {
      setActionLoading(null);
    }
  };

  const runMigration = async () => {
    const confirmed = window.confirm(
      "Run one-time migration to set missing property statuses to approved?",
    );
    if (!confirmed) return;

    setMigrationLoading(true);
    try {
      const res = await fetch("/api/admin/migrate-property-status", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      alert(
        `Migration complete. Matched: ${data.matchedCount}, Updated: ${data.modifiedCount}`,
      );
      await fetchProperties(filter);
    } catch (error) {
      console.error("Migration failed:", error);
      alert("Migration failed");
    } finally {
      setMigrationLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-800">Property Moderation</h1>
            <p className="text-gray-600 mt-1">
              Review property listings by approval status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/hosts"
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 px-4 py-2 rounded transition font-medium"
            >
              Admin Hosts
            </Link>
            <button
              type="button"
              onClick={runMigration}
              disabled={migrationLoading}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded transition font-medium disabled:opacity-60"
            >
              {migrationLoading ? "Running Migration..." : "Run Status Migration"}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
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
            {properties.map((prop) => (
              <div key={prop._id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                  <div className="flex gap-4 min-w-0">
                    <div className="w-28 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
                      {prop.images?.[0] ? (
                        <img
                          src={
                            prop.images[0].startsWith("http")
                              ? prop.images[0]
                              : `/images/properties/${prop.images[0]}`
                          }
                          alt={prop.name || "Property thumbnail"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {prop.name || "Untitled Property"}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {prop.type || "Unknown type"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {[prop.location?.city, prop.location?.state, prop.location?.country]
                          .filter(Boolean)
                          .join(", ") || "Location not set"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {prop.beds ?? 0} beds / {prop.baths ?? 0} baths
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted:{" "}
                        {prop.createdAt
                          ? new Date(prop.createdAt).toLocaleDateString()
                          : "Unknown"}
                      </p>
                      {prop.rejectionReason && (
                        <p className="text-sm text-red-700 mt-1">
                          Rejection reason: {prop.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap lg:flex-col gap-2 lg:items-end">
                    <Link
                      href={`/properties/${prop._id}`}
                      className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                    >
                      View listing
                    </Link>

                    {filter !== "approved" && (
                      <button
                        type="button"
                        onClick={() => handleAction(prop._id, "approved")}
                        disabled={actionLoading === String(prop._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50 text-sm"
                      >
                        {actionLoading === String(prop._id) ? "Processing..." : "Approve"}
                      </button>
                    )}

                    {filter !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => handleAction(prop._id, "rejected")}
                        disabled={actionLoading === String(prop._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50 text-sm"
                      >
                        {actionLoading === String(prop._id) ? "Processing..." : "Reject"}
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
