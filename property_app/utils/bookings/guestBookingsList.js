/**
 * Guest trips list query helpers for GET /api/user/bookings.
 * Matches profile counts dialect (upcoming/past) and my-bookings status set.
 */

const EXACT_STATUS = new Set(["pending", "confirmed", "cancelled"]);

/**
 * @param {string} guestId
 * @param {{ status?: string|null, today?: string }} [options]
 * @returns {{ ok: true, query: object, sort: object } | { ok: false, error: string }}
 */
export function buildGuestBookingsQuery(guestId, options = {}) {
  const guestIdStr = String(guestId || "").trim();
  if (!guestIdStr) {
    return { ok: false, error: "guestId required" };
  }

  const raw = options.status == null || options.status === ""
    ? "all"
    : String(options.status).trim().toLowerCase();

  // YYYY-MM-DD — same string compare as getProfilePayload upcoming/past counts
  const today =
    options.today || new Date().toISOString().slice(0, 10);

  const query = { guestId: guestIdStr };
  /** Default / list card order: newest check-in first */
  const sort = { checkIn: -1 };

  if (raw === "all") {
    query.status = { $in: ["confirmed", "pending", "cancelled"] };
    return { ok: true, query, sort, status: raw };
  }

  if (raw === "active") {
    query.status = { $in: ["pending", "confirmed"] };
    return { ok: true, query, sort, status: raw };
  }

  if (raw === "upcoming") {
    // Profile counts.bookingsUpcoming
    query.status = { $in: ["confirmed", "pending"] };
    query.checkIn = { $gte: today };
    return { ok: true, query, sort, status: raw };
  }

  if (raw === "past") {
    // Profile counts.bookingsPast
    query.status = "confirmed";
    query.checkOut = { $lt: today };
    return { ok: true, query, sort, status: raw };
  }

  if (EXACT_STATUS.has(raw)) {
    query.status = raw;
    return { ok: true, query, sort, status: raw };
  }

  return {
    ok: false,
    error:
      "Invalid status. Use all, active, pending, confirmed, cancelled, upcoming, or past",
  };
}
