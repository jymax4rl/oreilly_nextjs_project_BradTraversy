import Transaction from "@/models/Transaction";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import User from "@/models/User";
import { confirmBookingFromPayment } from "@/utils/bookings/confirmBooking";
import {
  bookingEmailConfigError,
  sendBookingConfirmationEmails,
} from "@/utils/email/sendBookingEmails";
import { countNights } from "@/utils/availability/validateStay";
import {
  formatPropertyLocation,
  propertyImageAbsoluteUrl,
} from "@/utils/email/propertyImageUrl";
import { formatPropertyMeta } from "@/utils/email/propertyMeta";
import { resolveHostContact } from "@/utils/email/resolveHostContact";

/**
 * Prefer first non-empty string among candidates (webhook vs client race).
 */
function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v == null) continue;
    const s = typeof v === "string" ? v.trim() : String(v).trim();
    if (s) return s;
  }
  return undefined;
}

/**
 * Resolve guest user from session id or customer email.
 */
async function resolveGuest({ userId, customerEmail, customerName }) {
  if (userId) {
    return {
      guestId: userId.toString(),
      guestName: customerName,
      guestEmail: customerEmail,
    };
  }
  if (customerEmail) {
    const user = await User.findOne({ email: customerEmail });
    if (user) {
      return {
        guestId: user._id.toString(),
        guestName: customerName || user.username,
        guestEmail: user.email,
      };
    }
  }
  return null;
}

/**
 * Fill missing stay/host fields from Property so webhook-created txs
 * (often missing Flutterwave meta) still get host confirmation email.
 * Mutates and returns body.
 */
export async function enrichStayMetaFromProperty(body) {
  if (!body?.property_id) return body;

  const needsHost =
    !body.host_email || !body.host_name || !body.property_name;
  if (!needsHost) return body;

  try {
    const property = await Property.findById(body.property_id)
      .select("name seller_info owner")
      .lean();
    if (!property) return body;

    body.property_name = firstNonEmpty(body.property_name, property.name);
    const host = await resolveHostContact(property, {
      host_email: body.host_email,
      host_name: body.host_name,
    });
    body.host_name = firstNonEmpty(body.host_name, host.hostName);
    body.host_email = firstNonEmpty(body.host_email, host.hostEmail);
    if (!body.host_id && property.owner) {
      body.host_id = String(property.owner);
    }
  } catch (err) {
    console.error("[booking email] Property enrich failed:", err);
  }
  return body;
}

/**
 * Merge client finalize body onto an existing transaction document fields.
 * Client POST usually has full host/dates; webhook may have created a sparse tx.
 */
function mergeTxBody(existingTx, override = {}) {
  return {
    transaction_id: existingTx.transaction_id,
    property_id: firstNonEmpty(override.property_id, existingTx.property_id),
    property_name: firstNonEmpty(
      override.property_name,
      existingTx.property_name,
    ),
    host_id: firstNonEmpty(override.host_id, existingTx.host_id),
    host_name: firstNonEmpty(override.host_name, existingTx.host_name),
    host_email: firstNonEmpty(override.host_email, existingTx.host_email),
    check_in: firstNonEmpty(override.check_in, existingTx.check_in),
    check_out: firstNonEmpty(override.check_out, existingTx.check_out),
    nights:
      override.nights != null
        ? Number(override.nights)
        : existingTx.nights,
    amount: override.amount ?? existingTx.amount,
    currency: firstNonEmpty(override.currency, existingTx.currency),
    customer_email: firstNonEmpty(
      override.customer_email,
      existingTx.customer_email,
    ),
    customer_name: firstNonEmpty(
      override.customer_name,
      existingTx.customer_name,
    ),
  };
}

/**
 * Persist enriched host/stay fields onto Transaction when webhook left them blank.
 */
async function patchTransactionMetaIfSparse(txDoc, body) {
  if (!txDoc) return;
  let dirty = false;
  const fields = [
    "property_id",
    "property_name",
    "host_id",
    "host_name",
    "host_email",
    "check_in",
    "check_out",
    "nights",
  ];
  for (const key of fields) {
    const next = body[key];
    const cur = txDoc[key];
    const curEmpty =
      cur == null || (typeof cur === "string" && !String(cur).trim());
    if (curEmpty && next != null && String(next).trim()) {
      txDoc[key] = next;
      dirty = true;
    }
  }
  if (dirty) {
    try {
      await txDoc.save();
    } catch (err) {
      console.error("[booking] Failed to patch transaction meta:", err);
    }
  }
}

/** Terminal success for confirmation mail — includes Settings opt-outs. */
function confirmationEmailTerminalOk(status) {
  return status === "sent" || status === "skipped" || status === "opted_out";
}

function bothConfirmationEmailsSucceeded(emailStatus) {
  const guest = emailStatus?.confirmedGuest;
  const host = emailStatus?.confirmedHost;
  // Failed must allow retry. opted_out is intentional (Settings) — do not retry.
  // skipped means missing / same-as-guest address (host skipped may still enrich-retry).
  return (
    confirmationEmailTerminalOk(guest) && confirmationEmailTerminalOk(host)
  );
}

async function clearEmailDispatchClaim(bookingId) {
  await Booking.findByIdAndUpdate(bookingId, {
    $unset: { confirmationEmailsDispatchedAt: 1 },
  }).catch(() => {});
}

/**
 * Send guest/host emails once per booking.
 * @param {object} opts
 * @param {boolean} [opts.force] — clear prior claim and resend
 * @returns {Promise<{ attempted: boolean, configError?: string, results?: object, guestStatus?: string, hostStatus?: string }>}
 */
export async function sendEmailsForBooking(
  bookingId,
  body,
  guest,
  nights,
  { force = false } = {},
) {
  const configErr = bookingEmailConfigError();
  if (configErr) {
    console.error(`[booking email] ${configErr}`);
    return { attempted: false, configError: configErr };
  }

  if (force) {
    await Booking.findByIdAndUpdate(bookingId, {
      $unset: {
        "emailStatus.confirmedGuest": 1,
        "emailStatus.confirmedHost": 1,
        confirmationEmailsDispatchedAt: 1,
      },
    }).catch(() => {});
  }

  const booking = await Booking.findById(bookingId)
    .select(
      "emailStatus confirmationEmailsDispatchedAt guestEmail guestName guestPhone paymentMode",
    )
    .lean();

  if (!booking) {
    return { attempted: false, configError: "Booking not found" };
  }

  // Enrich host from property before skip/claim decisions (webhook often lacks meta).
  await enrichStayMetaFromProperty(body);

  if (!force && bothConfirmationEmailsSucceeded(booking.emailStatus)) {
    // Webhook may have marked host "skipped" when meta lacked host_email.
    // If we now have a distinct host address (client finalize), retry host mail.
    // Do NOT retry when host Status is opted_out (user Settings preference).
    const hostWasSkipped = booking.emailStatus?.confirmedHost === "skipped";
    const canRetryHost =
      hostWasSkipped &&
      body.host_email &&
      body.host_email !==
        firstNonEmpty(guest?.guestEmail, booking.guestEmail);

    if (!canRetryHost) {
      return {
        attempted: false,
        results: { alreadySent: true },
        guestStatus: booking.emailStatus?.confirmedGuest,
        hostStatus: booking.emailStatus?.confirmedHost,
      };
    }

    await Booking.findByIdAndUpdate(bookingId, {
      $unset: {
        "emailStatus.confirmedHost": 1,
        confirmationEmailsDispatchedAt: 1,
      },
    }).catch(() => {});
  }

  // Atomic claim (skip if already claimed unless force cleared it).
  const claimed = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      confirmationEmailsDispatchedAt: { $exists: false },
    },
    { $set: { confirmationEmailsDispatchedAt: new Date() } },
    { new: false },
  );

  if (!claimed) {
    // Another request is in-flight or already claimed without success flags.
    // If prior attempt failed / host was incorrectly skipped, clear claim and retry.
    if (
      booking.emailStatus?.confirmedGuest === "failed" ||
      booking.emailStatus?.confirmedHost === "failed" ||
      booking.emailStatus?.confirmedHost === "skipped" ||
      (!booking.emailStatus?.confirmedGuest &&
        booking.confirmationEmailsDispatchedAt)
    ) {
      await clearEmailDispatchClaim(bookingId);
      const retried = await Booking.findOneAndUpdate(
        {
          _id: bookingId,
          confirmationEmailsDispatchedAt: { $exists: false },
        },
        { $set: { confirmationEmailsDispatchedAt: new Date() } },
        { new: false },
      );
      if (!retried) {
        console.warn(
          "[booking email] Could not claim booking for send (concurrent)",
          String(bookingId),
        );
        return { attempted: false };
      }
    } else {
      return { attempted: false };
    }
  }

  const resolvedGuest = {
    guestId: guest?.guestId,
    guestName: firstNonEmpty(guest?.guestName, booking.guestName),
    guestEmail: firstNonEmpty(guest?.guestEmail, booking.guestEmail),
    guestPhone: firstNonEmpty(guest?.guestPhone, booking.guestPhone),
  };

  if (!resolvedGuest.guestEmail) {
    console.warn(
      "[booking email] Guest email still missing after enrich",
      String(bookingId),
    );
  }
  if (!body.host_email) {
    console.warn(
      "[booking email] Host email still missing after property enrich",
      String(bookingId),
      "property",
      body.property_id,
    );
  }

  let propertyImageUrl;
  let locationLabel;
  let propertyMeta;
  try {
    const property = await Property.findById(body.property_id)
      .select("images location beds baths type")
      .lean();
    if (property) {
      propertyImageUrl = propertyImageAbsoluteUrl(property.images);
      locationLabel = formatPropertyLocation(property.location);
      propertyMeta = formatPropertyMeta(property, locationLabel);
    }
  } catch (err) {
    console.error("Property lookup for booking email:", err);
  }

  let outcome;
  try {
    console.info("[booking email] Auto-send starting", {
      bookingId: String(bookingId),
      force,
      guestEmail: resolvedGuest.guestEmail ? "set" : "missing",
      hostEmail: body.host_email ? "set" : "missing",
      transactionId: body.transaction_id,
    });
    outcome = await sendBookingConfirmationEmails({
      guestEmail: resolvedGuest.guestEmail,
      guestName: resolvedGuest.guestName,
      guestPhone: firstNonEmpty(
        resolvedGuest.guestPhone,
        body.guest_phone,
        booking.guestPhone,
      ),
      hostEmail: body.host_email,
      hostName: body.host_name,
      propertyName: body.property_name || "Property",
      propertyId: body.property_id?.toString?.() ?? body.property_id,
      propertyImageUrl,
      propertyMeta,
      locationLabel,
      checkIn: body.check_in,
      checkOut: body.check_out,
      nights,
      amount: body.amount,
      currency: body.currency,
      transactionId: body.transaction_id,
      bookingId: String(bookingId),
      paymentMode: body.payment_mode || booking.paymentMode,
      // Force resend must not collide with Resend's 24h idempotency cache.
      idempotencySuffix: force ? `force-${Date.now()}` : undefined,
      // Manual resend from host/admin tools bypasses Settings opt-outs.
      skipNotificationPrefs: force === true,
    });
  } catch (err) {
    console.error("Booking email error:", err);
    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        "emailStatus.confirmedGuest": "failed",
        "emailStatus.confirmedHost": "failed",
      },
      $unset: { confirmationEmailsDispatchedAt: 1 },
    }).catch(() => {});
    return { attempted: true, error: err.message || String(err) };
  }

  if (!outcome?.enabled) {
    // Config disappeared mid-flight — release claim so a later retry works.
    await clearEmailDispatchClaim(bookingId);
    return {
      attempted: false,
      configError: outcome?.error || bookingEmailConfigError(),
    };
  }

  const results = outcome.results;
  // Settings opt-out uses distinct status so enrich-retry does not re-send forever.
  const guestStatus = !resolvedGuest.guestEmail
    ? "skipped"
    : results?.guest?.reason === "opted_out"
      ? "opted_out"
      : results?.guest?.skipped
        ? "skipped"
        : results?.guest?.sent
          ? "sent"
          : "failed";
  // Same address as guest → intentional skip. Missing host email → failed (retry after enrich).
  // Host notification opt-out → opted_out (terminal; not a retryable failure).
  let hostStatus;
  if (body.host_email && body.host_email === resolvedGuest.guestEmail) {
    hostStatus = "skipped";
  } else if (!body.host_email) {
    hostStatus = "failed";
  } else if (results?.host?.reason === "opted_out") {
    hostStatus = "opted_out";
  } else if (results?.host?.skipped) {
    hostStatus = "skipped";
  } else {
    hostStatus = results?.host?.sent ? "sent" : "failed";
  }

  const lastError = firstNonEmpty(
    results?.guest?.error,
    results?.host?.error,
    outcome?.error,
  );
  const update = {
    $set: {
      "emailStatus.confirmedGuest": guestStatus,
      "emailStatus.confirmedHost": hostStatus,
    },
  };

  // Release claim when anything failed so finalize/webhook/resend can retry.
  if (guestStatus === "failed" || hostStatus === "failed") {
    if (lastError) update.$set["emailStatus.lastError"] = String(lastError).slice(0, 500);
    update.$unset = { confirmationEmailsDispatchedAt: 1 };
    console.error("[booking email] Send incomplete — claim released for retry", {
      bookingId: String(bookingId),
      guestStatus,
      hostStatus,
      guestError: results?.guest?.error,
      hostError: results?.host?.error,
    });
  } else {
    update.$unset = { "emailStatus.lastError": 1 };
    console.info("[booking email] Auto-send complete", {
      bookingId: String(bookingId),
      guestStatus,
      hostStatus,
    });
  }

  await Booking.findByIdAndUpdate(bookingId, update).catch((err) =>
    console.error("Failed to persist booking emailStatus:", err),
  );

  return {
    attempted: true,
    results,
    guestStatus,
    hostStatus,
  };
}

/**
 * Link booking + emails for a saved transaction payload.
 */
export async function attachBookingToTransaction(body, guestHint = {}) {
  await enrichStayMetaFromProperty(body);

  const guest = await resolveGuest({
    userId: guestHint.userId,
    customerEmail: guestHint.customerEmail || body.customer_email,
    customerName: guestHint.customerName || body.customer_name,
  });

  if (!body.check_in || !body.check_out || !body.property_id) {
    return { bookingId: null, bookingError: "Missing stay dates on payment" };
  }
  if (!guest) {
    return {
      bookingId: null,
      bookingError: "Sign in required to link booking to your account",
    };
  }

  const bookingResult = await confirmBookingFromPayment({
    propertyId: body.property_id.toString(),
    guestId: guest.guestId,
    guestName: guest.guestName,
    guestEmail: guest.guestEmail,
    guestPhone: body.guest_phone,
    checkIn: body.check_in,
    checkOut: body.check_out,
    transactionId: body.transaction_id,
    amount: body.amount,
    currency: body.currency,
    propertyName: body.property_name,
  });

  if (!bookingResult.ok || !bookingResult.booking) {
    return {
      bookingId: null,
      bookingError: bookingResult.error || "Booking could not be created",
    };
  }

  const bookingId = bookingResult.booking._id;
  const nights =
    body.nights ??
    bookingResult.nights ??
    countNights(body.check_in, body.check_out);

  // Always await — payment response waits for email attempt (failures logged + retriable).
  let emails = null;
  try {
    emails = await sendEmailsForBooking(
      bookingId,
      { ...body, property_id: body.property_id },
      guest,
      nights,
    );
  } catch (err) {
    console.error("Booking email error:", err);
    emails = { attempted: true, error: err.message || String(err) };
  }

  return { bookingId, bookingError: null, nights, emails };
}

/**
 * After Flutterwave verify: save transaction (idempotent) and create booking.
 * @param {object} body — client or webhook payload
 * @param {object} guestHint
 * @param {object} [clientOverride] — when re-finalizing an existing tx from client POST,
 *   non-empty fields here win over sparse webhook-created transaction rows.
 */
export async function finalizePaidTransaction(
  body,
  guestHint = {},
  clientOverride = null,
) {
  const existingTx = await Transaction.findOne({
    transaction_id: body.transaction_id,
  });

  if (existingTx) {
    const merged = mergeTxBody(existingTx, {
      ...body,
      ...(clientOverride || {}),
    });
    await enrichStayMetaFromProperty(merged);
    await patchTransactionMetaIfSparse(existingTx, merged);

    if (existingTx.booking) {
      const bookingId = existingTx.booking.toString();
      const guest = await resolveGuest({
        userId: existingTx.user?.toString() || guestHint.userId,
        customerEmail:
          merged.customer_email ||
          existingTx.customer_email ||
          guestHint.customerEmail,
        customerName:
          merged.customer_name ||
          existingTx.customer_name ||
          guestHint.customerName,
      });

      let emails = null;
      if (guest) {
        const nights =
          merged.nights ??
          (merged.check_in && merged.check_out
            ? countNights(merged.check_in, merged.check_out)
            : undefined);
        try {
          emails = await sendEmailsForBooking(bookingId, merged, guest, nights);
        } catch (err) {
          console.error("Booking email error:", err);
          emails = { attempted: true, error: err.message || String(err) };
        }
      } else {
        console.warn(
          "[booking email] Existing tx has booking but guest unresolved",
          bookingId,
        );
      }

      return {
        transaction: existingTx,
        bookingId,
        bookingError: null,
        created: false,
        emails,
      };
    }

    const attach = await attachBookingToTransaction(merged, {
      userId: existingTx.user?.toString() || guestHint.userId,
      customerEmail: merged.customer_email,
      customerName: merged.customer_name,
    });

    if (attach.bookingId) {
      existingTx.booking = attach.bookingId;
      await existingTx.save();
    }

    return {
      transaction: existingTx,
      bookingId: attach.bookingId?.toString?.() ?? attach.bookingId,
      bookingError: attach.bookingError,
      created: false,
      emails: attach.emails,
    };
  }

  await enrichStayMetaFromProperty(body);

  const newTransaction = await Transaction.create({
    transaction_id: body.transaction_id,
    tx_ref: body.tx_ref,
    flw_ref: body.flw_ref,
    amount: body.amount,
    currency: body.currency,
    status: body.status || "successful",
    customer_name: guestHint.customerName || body.customer_name,
    customer_email: guestHint.customerEmail || body.customer_email,
    charge_response_code: body.charge_response_code,
    charge_response_message: body.charge_response_message,
    flutterwave_created_at: body.flutterwave_created_at || new Date(),
    user: guestHint.userId || null,
    property_id: body.property_id || null,
    property_name: body.property_name,
    host_id: body.host_id,
    host_name: body.host_name,
    host_email: body.host_email,
    check_in: body.check_in,
    check_out: body.check_out,
    nights: body.nights,
  });

  const attach = await attachBookingToTransaction(
    {
      transaction_id: newTransaction.transaction_id,
      property_id: newTransaction.property_id,
      property_name: newTransaction.property_name,
      host_email: newTransaction.host_email,
      host_name: newTransaction.host_name,
      check_in: newTransaction.check_in,
      check_out: newTransaction.check_out,
      nights: newTransaction.nights,
      amount: newTransaction.amount,
      currency: newTransaction.currency,
      customer_email: newTransaction.customer_email,
      customer_name: newTransaction.customer_name,
    },
    guestHint,
  );

  if (attach.bookingId) {
    newTransaction.booking = attach.bookingId;
    await newTransaction.save();
  }

  return {
    transaction: newTransaction,
    bookingId: attach.bookingId?.toString?.() ?? attach.bookingId,
    bookingError: attach.bookingError,
    created: true,
    emails: attach.emails,
  };
}

/**
 * Webhook path: transaction already verified by Flutterwave API.
 */
export async function finalizeFromFlutterwaveCharge(data) {
  const transactionId = data.id;
  const body = {
    transaction_id: transactionId,
    tx_ref: data.tx_ref,
    flw_ref: data.flw_ref || data.reference || String(transactionId),
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    customer_name: data.customer?.name,
    customer_email: data.customer?.email,
    flutterwave_created_at: data.created_at
      ? new Date(data.created_at)
      : new Date(),
    property_id: data.meta?.property_id,
    property_name: data.meta?.property_name,
    host_id: data.meta?.host_id,
    host_name: data.meta?.host_name,
    host_email: data.meta?.host_email,
    check_in: data.meta?.check_in,
    check_out: data.meta?.check_out,
    nights: data.meta?.nights != null ? Number(data.meta.nights) : undefined,
  };

  const result = await finalizePaidTransaction(body, {
    customerEmail: body.customer_email,
    customerName: body.customer_name,
  });

  console.info("[booking email] Webhook finalize emails", {
    bookingId: result.bookingId,
    attempted: result.emails?.attempted,
    guestStatus: result.emails?.guestStatus,
    hostStatus: result.emails?.hostStatus,
    configError: result.emails?.configError,
    bookingError: result.bookingError,
  });

  return result;
}

export { bookingEmailConfigError };
