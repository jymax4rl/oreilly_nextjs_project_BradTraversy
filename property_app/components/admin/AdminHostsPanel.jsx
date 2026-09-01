"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatAddress } from "@/utils/address";
import { isOpsStaff } from "@/utils/opsAuth";
import OpsUserProfileModal from "@/components/admin/OpsUserProfileModal";

const SEARCH_DEBOUNCE_MS = 280;

function matchesSearch(app, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const addr = app.address || app.user?.hostAddress || {};
  const haystack = [
    app.user?.username,
    app.user?.email,
    app.phone,
    app.idType,
    app.idNumber,
    app.bio,
    app.rejectionReason,
    formatAddress(addr),
    addr.formatted,
    addr.streetLine1,
    addr.streetLine2,
    addr.city,
    addr.state,
    addr.postalCode,
    addr.country,
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());

  return haystack.some((text) => text.includes(q));
}

/**
 * Host applications moderation UI (shared by /ops/hosts).
 * Debounced search by name, email, phone, ID, bio, and address within the active tab.
 */
export default function AdminHostsPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    if (status === "authenticated" && !isOpsStaff(session?.user?.role)) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchQuery(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (status !== "authenticated" || !isOpsStaff(session?.user?.role)) return;

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

  const filteredApplications = useMemo(
    () => applications.filter((app) => matchesSearch(app, searchQuery)),
    [applications, searchQuery],
  );

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

  const openProfile = (userId) => {
    if (!userId) return;
    setProfileUserId(String(userId));
  };

  const handleProfileUpdated = ({ userId, banned, bannedAt, bannedReason }) => {
    setApplications((prev) =>
      prev.map((app) => {
        const uid = app.user?._id ? String(app.user._id) : "";
        if (uid !== String(userId)) return app;
        return {
          ...app,
          user: {
            ...app.user,
            banned,
            bannedAt,
            bannedReason,
          },
        };
      }),
    );
  };

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-[1.75rem]">
          Host Applications
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          Review and manage host onboarding applications. Search by name, email,
          phone, or address within the active tab. Open a profile for IDs and
          ban controls.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {["pending", "approved", "rejected"].map((statusFilter) => (
          <button
            key={statusFilter}
            type="button"
            onClick={() => setFilter(statusFilter)}
            className={`rounded-lg px-4 py-2 font-medium capitalize transition ${
              filter === statusFilter
                ? "bg-gray-900 text-white"
                : "border bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {statusFilter}
            {filter === statusFilter && applications.length > 0 && (
              <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-gray-900">
                {searchQuery.trim()
                  ? `${filteredApplications.length}/${applications.length}`
                  : applications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label htmlFor="ops-hosts-search" className="sr-only">
          Search hosts by name, email, phone, or address
        </label>
        <div className="relative max-w-xl">
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
            id="ops-hosts-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, phone, ID, city…"
            className="h-11 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white pl-10 pr-3 text-sm text-[var(--kama-ink)] outline-none transition placeholder:text-gray-400 focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center">
          <p className="text-lg text-gray-500">
            {applications.length === 0
              ? `No ${filter} applications found.`
              : "No hosts match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app._id}
              className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-6 transition hover:shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    {app.user?.image ? (
                      <img
                        src={app.user.image}
                        alt={app.user.username}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                        {app.user?.username?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openProfile(app.user?._id)}
                        disabled={!app.user?._id}
                        className="text-left font-bold text-gray-800 underline-offset-2 transition hover:text-[#1B5C57] hover:underline disabled:no-underline disabled:opacity-60"
                      >
                        {app.user?.username || "Unknown User"}
                      </button>
                      <p className="text-sm text-gray-500">{app.user?.email}</p>
                      {app.user?.banned ? (
                        <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                          Banned
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-gray-500">Phone:</span>{" "}
                      <span className="font-medium">{app.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">ID Type:</span>{" "}
                      <span className="font-medium capitalize">
                        {app.idType?.replace("_", " ") || "—"}
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
                    <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">
                      <span className="font-medium">Rejection reason:</span>{" "}
                      {app.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 lg:flex-col">
                  {filter !== "pending" && (
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
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

                  <button
                    type="button"
                    onClick={() => openProfile(app.user?._id)}
                    disabled={!app.user?._id}
                    className="w-full rounded border border-[#1B5C57]/30 bg-[#1B5C57]/5 px-4 py-2 font-medium text-[#1B5C57] transition hover:bg-[#1B5C57]/10 disabled:opacity-50 lg:w-auto"
                  >
                    View profile
                  </button>

                  {filter !== "approved" && (
                    <button
                      type="button"
                      onClick={() => handleAction(app._id, "approved")}
                      disabled={actionLoading === app._id}
                      className="w-full rounded bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:opacity-50 lg:w-auto"
                    >
                      {actionLoading === app._id ? "Processing..." : "Approve"}
                    </button>
                  )}

                  {filter !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => handleAction(app._id, "rejected")}
                      disabled={actionLoading === app._id}
                      className="w-full rounded bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-50 lg:w-auto"
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

      <OpsUserProfileModal
        open={Boolean(profileUserId)}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onUserUpdated={handleProfileUpdated}
      />
    </div>
  );
}
