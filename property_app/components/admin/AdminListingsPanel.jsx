"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { isOpsStaff, isSuperAdmin } from "@/utils/opsAuth";
import AdminListingCardActions from "@/components/admin/AdminListingCardActions";
import { propertyPublicPath } from "@/utils/listings/propertyPath";
import OpsUserProfileModal from "@/components/admin/OpsUserProfileModal";
import OpsListingsMap, {
  pinsFromProperties,
} from "@/components/maps/OpsListingsMap";
import OpsNewReservationsDropdown from "@/components/ops/OpsNewReservationsDropdown";
import OpsTrainingReservationModal from "@/components/ops/OpsTrainingReservationModal";

const SEARCH_DEBOUNCE_MS = 280;
const UNKNOWN_COUNTRY = "Unknown";

function countryLabel(property) {
  const raw = property?.location?.country;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return UNKNOWN_COUNTRY;
}

function matchesSearch(property, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const owner = property.ownerUser;
  const loc = property.location || {};
  const haystack = [
    property.name,
    owner?.username,
    owner?.email,
    property.seller_info?.name,
    property.seller_info?.email,
    loc.street,
    loc.streetLine2,
    loc.city,
    loc.state,
    loc.country,
    loc.zipcode,
    loc.formatted,
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());

  return haystack.some((text) => text.includes(q));
}

/**
 * Property listings moderation UI (shared by /ops/listings).
 * Includes View, Message host, and Delete (type-confirm) actions.
 * Country chips, host/location search, and a side map of filtered pins.
 */
export default function AdminListingsPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownerFilter = (searchParams.get("owner") || "").trim();
  const [properties, setProperties] = useState([]);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    hidden: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(() => {
    const fromUrl = searchParams.get("status");
    return ["pending", "approved", "rejected", "hidden"].includes(fromUrl)
      ? fromUrl
      : "pending";
  });
  const [actionLoading, setActionLoading] = useState(null);
  const [countryFilter, setCountryFilter] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapOpenMobile, setMapOpenMobile] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [trainingProperty, setTrainingProperty] = useState(null);

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

    const fetchListings = async () => {
      setLoading(true);
      setCountryFilter(null);
      try {
        const res = await fetch(
          `/api/admin/listings?status=${encodeURIComponent(filter)}${
            ownerFilter ? `&owner=${encodeURIComponent(ownerFilter)}` : ""
          }&nc=${Date.now()}`,
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
            hidden: Number(data.counts.hidden) || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filter, ownerFilter, session, status]);

  const searchMatched = useMemo(
    () => properties.filter((p) => matchesSearch(p, searchQuery)),
    [properties, searchQuery],
  );

  const countryCounts = useMemo(() => {
    const map = new Map();
    for (const p of searchMatched) {
      const key = countryLabel(p);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.country.localeCompare(b.country);
      });
  }, [searchMatched]);

  const filteredProperties = useMemo(() => {
    if (!countryFilter) return searchMatched;
    return searchMatched.filter((p) => countryLabel(p) === countryFilter);
  }, [searchMatched, countryFilter]);

  const mapPins = useMemo(
    () => pinsFromProperties(filteredProperties),
    [filteredProperties],
  );

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
        `/api/admin/listings?status=${encodeURIComponent(filter)}${
          ownerFilter ? `&owner=${encodeURIComponent(ownerFilter)}` : ""
        }&nc=${Date.now()}`,
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
            hidden: Number(syncData.counts.hidden) || 0,
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

  const handleVisibility = async (id, listed) => {
    const idStr = String(id);
    if (
      !listed &&
      !window.confirm(
        "Hide this listing from the public website? It will not be deleted. Find it under Hidden to show it again.",
      )
    ) {
      return;
    }
    setActionLoading(idStr);
    try {
      const res = await fetch(`/api/admin/listings/${idStr}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listed }),
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server returned ${res.status}`);
      }
      const syncRes = await fetch(
        `/api/admin/listings?status=${encodeURIComponent(filter)}${
          ownerFilter ? `&owner=${encodeURIComponent(ownerFilter)}` : ""
        }&nc=${Date.now()}`,
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
            hidden: Number(syncData.counts.hidden) || 0,
          });
        }
      } else {
        setProperties((prev) => prev.filter((p) => String(p._id) !== idStr));
      }
    } catch (error) {
      console.error("handleVisibility error:", error);
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
        <h1 className="text-[1.45rem] font-semibold tracking-tight text-[var(--kama-ink)] sm:text-[1.75rem]">
          Property listings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          Approve to publish publicly, or reject with a reason for the host.
          Approving a host’s first listing may assign a Founding 100 spot when
          the program is active and spots remain. Pending shows new submissions
          only; older listings stay under Approved. Superadmins can Hide a live
          listing from the public site without deleting it. Filter by country or
          search host and location within the active tab. Use Test stay to seed
          a host calendar with a training guest (no emails, excluded from
          analytics).
        </p>
      </header>

      {ownerFilter ? (
        <p className="mb-4 rounded-xl border border-[#1B5C57]/20 bg-[#1B5C57]/5 px-4 py-2.5 text-sm text-[#1B5C57]">
          Showing listings for this host.{" "}
          <Link href="/ops/listings" className="font-semibold underline-offset-2 hover:underline">
            Show all hosts
          </Link>
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
        {["pending", "approved", "hidden", "rejected"].map((statusFilter) => (
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
        <OpsNewReservationsDropdown />
      </div>

      <div className="mb-4">
        <label htmlFor="ops-listings-search" className="sr-only">
          Search by host or location
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
            id="ops-listings-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search host name, email, city, country…"
            className="h-11 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white pl-10 pr-3 text-sm text-[var(--kama-ink)] outline-none transition placeholder:text-gray-400 focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20"
          />
        </div>
      </div>

      {!loading && properties.length > 0 ? (
        <div
          className="mb-6 flex gap-2 overflow-x-auto pb-1"
          role="toolbar"
          aria-label="Filter by country"
        >
          <button
            type="button"
            onClick={() => setCountryFilter(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              countryFilter == null
                ? "bg-[#1B5C57] text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All ({searchMatched.length})
          </button>
          {countryCounts.map(({ country, count }) => {
            const active = countryFilter === country;
            return (
              <button
                key={country}
                type="button"
                onClick={() =>
                  setCountryFilter((prev) => (prev === country ? null : country))
                }
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-[#1B5C57] text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {country} ({count})
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
        <div className="min-w-0 order-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center text-gray-500">
              {properties.length === 0
                ? `No ${filter} listings.`
                : "No listings match your search or country filter."}
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredProperties.map((property) => {
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
                          Host:{" "}
                          {ownerId ? (
                            <button
                              type="button"
                              onClick={() => setProfileUserId(ownerId)}
                              className="font-medium text-[#1B5C57] underline-offset-2 hover:underline"
                            >
                              {ownerLabel}
                            </button>
                          ) : (
                            ownerLabel
                          )}
                          {property.ownerUser?.banned ? (
                            <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800">
                              Banned
                            </span>
                          ) : null}
                          {property.listingModerationRequestedAt
                            ? ` · Submitted ${new Date(
                                property.listingModerationRequestedAt,
                              ).toLocaleDateString()}`
                            : null}
                          {property.listed === false ? (
                            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                              Hidden from web
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-2">
                          <Link
                            href={`/ops/reservations?propertyId=${encodeURIComponent(id)}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            {Number(property.reservationCount) || 0}{" "}
                            {Number(property.reservationCount) === 1
                              ? "reservation"
                              : "reservations"}
                            {Number(property.pendingReservationCount) > 0 ? (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                {property.pendingReservationCount} new
                              </span>
                            ) : null}
                          </Link>
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
                        listingHref={propertyPublicPath(property)}
                        ownerId={ownerId}
                        hostLabel={
                          typeof ownerLabel === "string" ? ownerLabel : "host"
                        }
                        moderationButtons={moderationButtons}
                        listed={property.listed !== false}
                        canHide={isSuperAdmin(session?.user?.role)}
                        onToggleListed={(nextListed) =>
                          handleVisibility(id, nextListed)
                        }
                        onDeleted={() => {
                          setProperties((prev) =>
                            prev.filter((p) => String(p._id) !== id),
                          );
                          setCounts((prev) => ({
                            ...prev,
                            [filter]: Math.max(0, (prev[filter] ?? 1) - 1),
                          }));
                        }}
                        onTrainingStay={() =>
                          setTrainingProperty({
                            _id: id,
                            name: property.name || "Untitled",
                          })
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="order-2 lg:sticky lg:top-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Map overview
                </h2>
                <p className="text-xs text-gray-500">
                  Pins for filtered listings with coordinates
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 lg:hidden"
                onClick={() => setMapOpenMobile((v) => !v)}
                aria-expanded={mapOpenMobile}
              >
                {mapOpenMobile ? "Hide" : "Show"}
              </button>
            </div>
            <div className={mapOpenMobile ? "block" : "hidden lg:block"}>
              <OpsListingsMap
                pins={mapPins}
                className="h-56 w-full lg:h-[28rem]"
                emptyLabel={
                  loading
                    ? "Loading…"
                    : "No mapped locations in this result set"
                }
              />
            </div>
          </div>
        </aside>
      </div>

      <OpsUserProfileModal
        open={Boolean(profileUserId)}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onUserUpdated={({ userId, banned }) => {
          setProperties((prev) =>
            prev.map((p) => {
              const oid = p.owner ? String(p.owner._id || p.owner) : "";
              if (oid !== String(userId)) return p;
              return {
                ...p,
                ownerUser: p.ownerUser
                  ? { ...p.ownerUser, banned }
                  : { banned },
              };
            }),
          );
        }}
      />
      <OpsTrainingReservationModal
        open={Boolean(trainingProperty)}
        property={trainingProperty}
        onClose={() => setTrainingProperty(null)}
        onCreated={() => {
          setProperties((prev) =>
            prev.map((p) =>
              String(p._id) === String(trainingProperty?._id)
                ? {
                    ...p,
                    reservationCount: (Number(p.reservationCount) || 0) + 1,
                  }
                : p,
            ),
          );
        }}
      />
    </div>
  );
}
