/**
 * Host reservation search: Ref # (transactionId / tx_ref / flw_ref)
 * and guest name / email. UI Ref is Booking.transactionId.
 */

/**
 * Normalize search needle. Strips leading "Ref" / "#" for id searches;
 * leaves names/emails intact.
 * @param {string|null|undefined} raw
 * @returns {string|null}
 */
export function normalizeBookingSearchQuery(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  // Only strip Ref/# when the rest looks like an id (digits / alnum ref).
  const stripped = s.replace(/^ref\.?\s*/i, "").replace(/^#\s*/, "").trim();
  if (stripped && /^[\dA-Za-z_-]+$/.test(stripped)) {
    return stripped;
  }
  return s;
}

/** @deprecated use normalizeBookingSearchQuery */
export function normalizeBookingRefQuery(raw) {
  return normalizeBookingSearchQuery(raw);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Mongo $or for Booking: transactionId, guestName, guestEmail.
 * @param {string} needle
 */
export function bookingSearchMongoOr(needle) {
  const safe = escapeRegex(needle);
  const or = [
    {
      $expr: {
        $regexMatch: {
          input: { $toString: { $ifNull: ["$transactionId", ""] } },
          regex: safe,
          options: "i",
        },
      },
    },
    { guestName: { $regex: safe, $options: "i" } },
    { guestEmail: { $regex: safe, $options: "i" } },
    { guestPhone: { $regex: safe, $options: "i" } },
  ];

  if (Number.isFinite(Number(needle)) && /^\d+$/.test(needle)) {
    or.push({ transactionId: Number(needle) });
  }

  return or;
}

/** @deprecated use bookingSearchMongoOr */
export function bookingRefMongoOr(refNorm) {
  return bookingSearchMongoOr(refNorm);
}

/**
 * Find booking ids whose Transaction.tx_ref / flw_ref / transaction_id match.
 */
export async function bookingIdsFromTransactionRef(
  TransactionModel,
  needle,
  propertyIds,
) {
  if (!needle || !propertyIds?.length) return [];

  const safe = escapeRegex(needle);
  const or = [
    { tx_ref: { $regex: safe, $options: "i" } },
    { flw_ref: { $regex: safe, $options: "i" } },
    {
      $expr: {
        $regexMatch: {
          input: { $toString: { $ifNull: ["$transaction_id", ""] } },
          regex: safe,
          options: "i",
        },
      },
    },
  ];

  if (Number.isFinite(Number(needle)) && /^\d+$/.test(needle)) {
    or.push({ transaction_id: Number(needle) });
  }

  const txs = await TransactionModel.find({
    property_id: { $in: propertyIds },
    $or: or,
  })
    .select("booking transaction_id")
    .lean();

  return txs.filter((tx) => tx.booking).map((tx) => tx.booking);
}

/**
 * Client-side match: ref, guest name, guest email.
 */
export function bookingMatchesSearch(booking, raw) {
  const needle = normalizeBookingSearchQuery(raw);
  if (!needle) return true;
  const n = needle.toLowerCase();
  const candidates = [
    booking.transactionId,
    booking.tx_ref,
    booking.flw_ref,
    booking._id,
    booking.guestName,
    booking.guestEmail,
    booking.guestPhone,
  ];
  return candidates.some((c) => {
    if (c == null || c === "") return false;
    return String(c).toLowerCase().includes(n);
  });
}

/** @deprecated use bookingMatchesSearch */
export function bookingMatchesRef(booking, refRaw) {
  return bookingMatchesSearch(booking, refRaw);
}
