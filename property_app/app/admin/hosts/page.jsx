"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatAddress } from "@/utils/address";

export default function AdminHostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
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

    const fetchApplications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/hosts?status=${filter}`);
        const data = await res.json();
        setApplications(data.applications || []);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [filter, session, status]);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const body = { status: action };
      if (action === "rejected") {
        const reason = window.prompt("Enter rejection reason (optional):");
        if (reason) body.rejectionReason = reason;
      }

      const res = await fetch(`/api/admin/hosts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server returned ${res.status}`);
      }

      setApplications((prev) => prev.filter((app) => app._id !== id));
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
            href="/login"
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
              Host Applications
            </h1>
            <p className="text-gray-600 mt-1">
              Review and manage host onboarding applications
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin/transactions" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded transition font-medium"
            >
              View Transactions
            </Link>
          </div>
        </div>

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
              {filter === statusFilter && applications.length > 0 && (
                <span className="ml-2 bg-white text-gray-900 text-xs px-2 py-0.5 rounded-full">
                  {applications.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-500 text-lg">
              No {filter} applications found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {app.user?.image ? (
                        <img
                          src={app.user.image}
                          alt={app.user.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                          {app.user?.username?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {app.user?.username || "Unknown User"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {app.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Phone:</span>{" "}
                        <span className="font-medium">{app.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">ID Type:</span>{" "}
                        <span className="font-medium capitalize">
                          {app.idType.replace("_", " ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">ID Number:</span>{" "}
                        <span className="font-medium">{app.idNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Submitted:</span>{" "}
                        <span className="font-medium">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {(app.address || app.user?.hostAddress) && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Address:</span>{" "}
                        <span className="font-medium">
                          {formatAddress(app.address || app.user?.hostAddress)}
                        </span>
                      </div>
                    )}
                    {app.bio && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Bio:</span>{" "}
                        <span className="text-gray-700">{app.bio}</span>
                      </div>
                    )}
                    {app.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
                        <span className="font-medium">Rejection reason:</span>{" "}
                        {app.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="flex lg:flex-col gap-2 items-start">
                    {/* Status badge for non-pending */}
                    {filter !== "pending" && (
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            app.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {app.status}
                        </span>
                        {app.reviewedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(app.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Approve button — shown on pending + rejected tabs */}
                    {filter !== "approved" && (
                      <button
                        onClick={() => handleAction(app._id, "approved")}
                        disabled={actionLoading === app._id}
                        className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
                      >
                        {actionLoading === app._id ? "Processing..." : "Approve"}
                      </button>
                    )}

                    {/* Reject button — shown on pending + approved tabs */}
                    {filter !== "rejected" && (
                      <button
                        onClick={() => handleAction(app._id, "rejected")}
                        disabled={actionLoading === app._id}
                        className="w-full lg:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
                      >
                        {actionLoading === app._id ? "Processing..." : "Reject"}
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
