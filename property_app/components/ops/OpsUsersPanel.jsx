"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isOpsStaff } from "@/utils/opsAuth";
import OpsUserProfileModal from "@/components/admin/OpsUserProfileModal";

const SEARCH_DEBOUNCE_MS = 280;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "guest", label: "Guests" },
  { id: "applicant", label: "Applicants" },
  { id: "host", label: "Hosts" },
  { id: "staff", label: "Staff" },
  { id: "banned", label: "Banned" },
];

function hostStatusLabel(status) {
  switch (status) {
    case "verified":
      return "Verified host";
    case "onboarding":
      return "Host application pending";
    case "rejected":
      return "Host application rejected";
    default:
      return "Guest";
  }
}

function formatJoined(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function OpsUsersPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    if (status === "authenticated" && !isOpsStaff(session?.user?.role)) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(searchInput), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (status !== "authenticated" || !isOpsStaff(session?.user?.role)) return;

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("filter", filter);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        const res = await fetch(`/api/ops/users?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error((await res.text()) || `Failed (${res.status})`);
        }
        const data = await res.json();
        setUsers(data.users || []);
        setCounts(data.counts || {});
        setTotal(data.total || 0);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setError(err.message || "Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [filter, searchQuery, session, status]);

  const filterCount = (id) =>
    typeof counts[id] === "number" ? counts[id] : id === "all" ? total : null;

  const heading = useMemo(() => {
    if (loading) return "Loading accounts…";
    if (searchQuery.trim()) {
      return `${users.length} match${users.length === 1 ? "" : "es"} · ${total} total accounts`;
    }
    return `${users.length} of ${total} accounts`;
  }, [loading, searchQuery, users.length, total]);

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
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-[1.75rem]">
          Users
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          Every account created on the platform — guests, host applicants, verified
          hosts, and staff. Open a row for profile, host ID, and ban controls.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const count = filterCount(item.id);
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-lg px-4 py-2 font-medium transition ${
                active
                  ? "bg-gray-900 text-white"
                  : "border bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
              {typeof count === "number" ? (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    active ? "bg-white text-gray-900" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <label htmlFor="ops-users-search" className="sr-only">
          Search users by name or email
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
            id="ops-users-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email…"
            className="h-11 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white pl-10 pr-3 text-sm text-[var(--kama-ink)] outline-none transition placeholder:text-gray-400 focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20"
          />
        </div>
        <p className="mt-2 text-xs text-[var(--kama-ink-muted)]">{heading}</p>
      </div>

      {error ? (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center">
          <p className="text-lg text-gray-500">
            {searchQuery.trim()
              ? "No accounts match your search."
              : "No accounts in this filter yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-28">
          {users.map((user) => (
            <div
              key={user._id}
              className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5 transition hover:shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                      {user.username?.charAt(0)?.toUpperCase() ||
                        user.email?.charAt(0)?.toUpperCase() ||
                        "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setProfileUserId(user._id)}
                      className="text-left font-bold text-gray-800 underline-offset-2 transition hover:text-[#1B5C57] hover:underline"
                    >
                      {user.username || "Unnamed account"}
                    </button>
                    <p className="truncate text-sm text-gray-500">{user.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {hostStatusLabel(user.hostStatus)}
                      </span>
                      {user.role === "admin" || user.role === "superadmin" ? (
                        <span className="rounded-full bg-[#1b5c57]/10 px-2 py-0.5 text-xs font-semibold text-[#1b5c57]">
                          {user.role}
                        </span>
                      ) : null}
                      {user.banned ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                          Banned
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <p className="text-xs text-gray-500">
                    Joined {formatJoined(user.createdAt)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setProfileUserId(user._id)}
                    className="rounded-lg border border-[var(--kama-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)]"
                  >
                    Open profile
                  </button>
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
        onUserUpdated={({ userId, banned, bannedAt }) => {
          setUsers((prev) =>
            prev.map((user) =>
              user._id === String(userId)
                ? { ...user, banned: Boolean(banned), bannedAt: bannedAt || null }
                : user,
            ),
          );
        }}
      />
    </div>
  );
}
