import { Resend } from "resend";
import {
  GUEST_TEMPLATE_ALIAS,
  HOST_TEMPLATE_ALIAS,
  bookingDetailRowHtml,
  renderGuestBookingEmailHtml,
  renderHostBookingEmailHtml,
  reservationReferenceBannerHtml,
} from "@/utils/email/bookingEmailTemplateHtml";
import { brandLogoUrl } from "@/utils/appUrl";
import { getBookingResendApiKey } from "@/utils/email/resendKeys";
import { getEmailFrom, getEmailReplyTo } from "@/utils/email/fromAddress";
import {
  formatPropertyLocation,
  getAbsoluteAppUrl,
  propertyImageAbsoluteUrl,
} from "@/utils/email/propertyImageUrl";
import { formatPropertyMeta } from "@/utils/email/propertyMeta";
import { applyNotificationPrefsToEmailPayload } from "@/utils/user/notificationPrefs";
import { listingPublicUrlFor } from "@/utils/listings/propertySlug";

let resendClient = null;
let resendClientKey = null;

function getResend() {
  const apiKey = getBookingResendApiKey();
  if (!apiKey) return null;
  if (!resendClient || resendClientKey !== apiKey) {
    resendClient = new Resend(apiKey);
    resendClientKey = apiKey;
  }
  return resendClient;
}

/** True when Resend is configured. From-address defaults to Camara Djehuty <camara-djehuty@isisel.com>. */
export function isBookingEmailConfigured() {
  return Boolean(getBookingResendApiKey());
}

export function bookingEmailConfigError() {
  if (getBookingResendApiKey()) return null;
  return "Missing RESEND_BOOKING_API_KEY (or RESEND_API_KEY) — add it to .env.local and restart npm run dev";
}

function formatStayLabel(checkIn, checkOut, nights) {
  return `${checkIn} → ${checkOut} (${nights} night${nights !== 1 ? "s" : ""})`;
}

function formatAmountLabel(amount, currency, { guest = false } = {}) {
  if (amount == null || !currency) {
    return guest ? "See your receipt" : "—";
  }
  return `${currency} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatGuestLine(guestName, guestEmail, guestPhone) {
  const name = guestName || "Guest";
  const parts = [];
  if (guestEmail) parts.push(guestEmail);
  if (guestPhone) parts.push(guestPhone);
  if (parts.length === 0) return name;
  return `${name} (${parts.join(" · ")})`;
}

/** Display form used in My Bookings / emails: Ref #10461903 */
export function formatReservationReference(transactionId) {
  if (transactionId == null || transactionId === "") return "";
  const id = String(transactionId).trim();
  if (!id || id === "—") return "";
  return id.startsWith("Ref") || id.startsWith("#") ? id : `Ref #${id}`;
}

function withReservationReferenceFields(vars, reservationReference) {
  const ref = reservationReference || "Ref #—";
  return {
    ...vars,
    RESERVATION_REFERENCE: ref,
    reservation_reference: ref,
    RESERVATION_REFERENCE_HTML: reservationReferenceBannerHtml(ref),
  };
}

function buildPlainTextBookingEmail({
  subject,
  heroTitle,
  heroSubtitle,
  propertyName,
  stayLabel,
  amountLabel,
  reservationReference,
  locationLabel,
  guestLine,
}) {
  const lines = [
    subject,
    "",
    heroTitle,
    heroSubtitle,
    "",
    `Reservation reference: ${reservationReference || "Not available"}`,
    `Property: ${propertyName || "Property"}`,
    locationLabel ? `Location: ${locationLabel}` : null,
    stayLabel ? `Stay: ${stayLabel}` : null,
    amountLabel ? `Amount: ${amountLabel}` : null,
    guestLine ? `Guest: ${guestLine}` : null,
    "",
    "Isisel — https://www.isisel.com",
  ].filter((l) => l != null);
  return lines.join("\n");
}

function buildGuestBookingDetailsHtml({
  locationLabel,
  stayLabel,
  amountLabel,
  referenceId,
  previousStayLabel,
  extraRows = [],
  amountRowLabel = "Total paid",
}) {
  const refDisplay =
    referenceId && referenceId !== "—"
      ? formatReservationReference(referenceId) || String(referenceId)
      : "Not available";
  const rows = [
    bookingDetailRowHtml({
      label: "Reservation reference",
      value: `<strong style="font-size:18px;letter-spacing:0.02em;">${refDisplay}</strong>`,
    }),
    bookingDetailRowHtml({ label: "Location", value: locationLabel || "—" }),
  ];
  if (previousStayLabel) {
    rows.push(
      bookingDetailRowHtml({
        label: "Previous stay",
        value: previousStayLabel,
      }),
    );
    rows.push(
      bookingDetailRowHtml({
        label: "New stay",
        value: `<strong>${stayLabel}</strong>`,
      }),
    );
  } else {
    rows.push(
      bookingDetailRowHtml({
        label: "Stay",
        value: `<strong>${stayLabel}</strong>`,
      }),
    );
  }
  rows.push(
    bookingDetailRowHtml({
      label: amountRowLabel,
      value: `<strong>${amountLabel}</strong>`,
    }),
  );
  for (const row of extraRows) {
    rows.push(bookingDetailRowHtml(row));
  }
  return rows.join("");
}

function buildHostBookingDetailsHtml({
  guestLine,
  locationLabel,
  stayLabel,
  amountLabel,
  referenceId,
  previousStayLabel,
  extraRows = [],
}) {
  const refDisplay =
    referenceId && referenceId !== "—"
      ? formatReservationReference(referenceId) || String(referenceId)
      : "Not available";
  const rows = [
    bookingDetailRowHtml({
      label: "Reservation reference",
      value: `<strong style="font-size:18px;letter-spacing:0.02em;">${refDisplay}</strong>`,
    }),
  ];
  rows.push(bookingDetailRowHtml({ label: "Guest", value: guestLine }));
  rows.push(
    bookingDetailRowHtml({ label: "Location", value: locationLabel || "—" }),
  );
  if (previousStayLabel) {
    rows.push(
      bookingDetailRowHtml({
        label: "Previous stay",
        value: previousStayLabel,
      }),
    );
    rows.push(
      bookingDetailRowHtml({
        label: "New stay",
        value: `<strong>${stayLabel}</strong>`,
      }),
    );
  } else {
    rows.push(
      bookingDetailRowHtml({
        label: "Stay",
        value: `<strong>${stayLabel}</strong>`,
      }),
    );
  }
  rows.push(
    bookingDetailRowHtml({
      label: "Amount",
      value: `<strong>${amountLabel}</strong>`,
    }),
  );
  for (const row of extraRows) {
    rows.push(bookingDetailRowHtml(row));
  }
  return rows.join("");
}

function buildGuestTemplateVariables(payload) {
  const {
    guestName,
    propertyName,
    propertyImageUrl,
    propertyUrl,
    propertyMeta,
    locationLabel,
    checkIn,
    checkOut,
    nights,
    amount,
    currency,
    transactionId,
    previousCheckIn,
    previousCheckOut,
    previousNights,
    heroTitle,
    heroSubtitle,
    previewText,
    statusBadge,
    statusBadgeBg,
    statusBadgeColor,
    ctaUrl,
    ctaLabel,
    secondaryNote,
    extraDetailRows,
    amountRowLabel,
    paymentMode,
  } = payload;

  const stayLabel = formatStayLabel(checkIn, checkOut, nights);
  const previousStayLabel =
    previousCheckIn && previousCheckOut
      ? formatStayLabel(
          previousCheckIn,
          previousCheckOut,
          previousNights ??
            countNightsSafe(previousCheckIn, previousCheckOut),
        )
      : null;
  const amountLabel = formatAmountLabel(amount, currency, { guest: true });
  const reservationReference = formatReservationReference(transactionId);
  const referenceId = reservationReference || "—";
  const siteUrl = getAbsoluteAppUrl();
  const isManual = paymentMode === "manual";

  const basePreview =
    previewText ||
    (isManual
      ? `Your reservation request at ${propertyName || "your property"} was received. Arrange payment with the host.`
      : `Your booking at ${propertyName || "your property"} is confirmed.`);
  const previewWithRef = reservationReference
    ? `${basePreview} ${reservationReference}.`
    : basePreview;

  return withReservationReferenceFields(
    {
      APP_URL: siteUrl,
      LOGO_URL: brandLogoUrl(),
      PREVIEW_TEXT: previewWithRef,
      HEADER_LINK_URL: getAbsoluteAppUrl("/properties"),
      HEADER_LINK_LABEL: "View listings",
      HERO_TITLE: heroTitle || (isManual ? "Reservation requested" : "You're all set for your stay"),
      HERO_SUBTITLE:
        heroSubtitle ||
        (isManual
          ? `Hi ${guestName || "there"}, your stay at ${propertyName || "the property"} is reserved pending payment. Message the host to arrange payment — no online checkout required.`
          : `Hi ${guestName || "there"}, your reservation at ${propertyName || "the property"} is confirmed. We look forward to hosting you.`),
      STATUS_BADGE: statusBadge || (isManual ? "Awaiting payment" : "Confirmed"),
      STATUS_BADGE_BG: statusBadgeBg || (isManual ? "#fffbeb" : "#ecfdf5"),
      STATUS_BADGE_COLOR: statusBadgeColor || (isManual ? "#b45309" : "#059669"),
      RECIPIENT_NAME: guestName || "there",
      PROPERTY_NAME: propertyName || "Property",
      PROPERTY_IMAGE_URL:
        propertyImageUrl || propertyImageAbsoluteUrl(undefined),
      PROPERTY_URL: propertyUrl || siteUrl,
      PROPERTY_META: propertyMeta || locationLabel || "",
      STAY_LABEL: stayLabel,
      AMOUNT_LABEL: amountLabel,
      BOOKING_DETAILS_HTML: buildGuestBookingDetailsHtml({
        locationLabel,
        stayLabel,
        amountLabel,
        referenceId,
        previousStayLabel,
        extraRows: extraDetailRows,
        amountRowLabel:
          amountRowLabel || (isManual ? "Stay total (pay host)" : "Total paid"),
      }),
      CTA_URL: ctaUrl || getAbsoluteAppUrl("/my-bookings"),
      CTA_LABEL: ctaLabel || "View my bookings",
      SECONDARY_CTA_URL: getAbsoluteAppUrl("/properties"),
      SECONDARY_CTA_LABEL: "Browse all listings",
      SECONDARY_NOTE:
        secondaryNote ||
        (isManual
          ? "Payment is arranged directly with your host via messages, call, or WhatsApp."
          : "Questions about your stay? Reply to this email or visit your dashboard."),
    },
    reservationReference,
  );
}

function countNightsSafe(checkIn, checkOut) {
  try {
    const a = Date.parse(`${checkIn}T00:00:00.000Z`);
    const b = Date.parse(`${checkOut}T00:00:00.000Z`);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
    return Math.round((b - a) / (24 * 60 * 60 * 1000));
  } catch {
    return 0;
  }
}

function buildHostTemplateVariables(payload) {
  const {
    hostName,
    propertyName,
    propertyImageUrl,
    propertyUrl,
    propertyMeta,
    locationLabel,
    guestName,
    guestEmail,
    guestPhone,
    checkIn,
    checkOut,
    nights,
    amount,
    currency,
    transactionId,
    previousCheckIn,
    previousCheckOut,
    previousNights,
    heroTitle,
    heroSubtitle,
    previewText,
    statusBadge,
    statusBadgeBg,
    statusBadgeColor,
    ctaUrl,
    ctaLabel,
    secondaryNote,
    extraDetailRows,
    paymentMode,
  } = payload;

  const stayLabel = formatStayLabel(checkIn, checkOut, nights);
  const previousStayLabel =
    previousCheckIn && previousCheckOut
      ? formatStayLabel(
          previousCheckIn,
          previousCheckOut,
          previousNights ??
            countNightsSafe(previousCheckIn, previousCheckOut),
        )
      : null;
  const amountLabel = formatAmountLabel(amount, currency);
  const guestLine = formatGuestLine(guestName, guestEmail, guestPhone);
  const reservationReference = formatReservationReference(transactionId);
  const referenceId = reservationReference || "—";
  const siteUrl = getAbsoluteAppUrl();
  const isManual = paymentMode === "manual";

  const hostExtraRows = [...(extraDetailRows || [])];
  if (guestPhone) {
    hostExtraRows.unshift({
      label: "Guest phone",
      value: `<strong>${guestPhone}</strong>`,
    });
  }
  if (isManual) {
    hostExtraRows.push({
      label: "Payment",
      value: "Arrange with guest (offline / messaging)",
    });
  }

  const basePreview =
    previewText ||
    (isManual
      ? `New reservation request for ${propertyName || "your listing"} — arrange payment with the guest.`
      : `New booking for ${propertyName || "your listing"}.`);
  const previewWithRef = reservationReference
    ? `${basePreview} ${reservationReference}.`
    : basePreview;

  return withReservationReferenceFields(
    {
      APP_URL: siteUrl,
      LOGO_URL: brandLogoUrl(),
      PREVIEW_TEXT: previewWithRef,
      HEADER_LINK_URL: getAbsoluteAppUrl("/host/reservations"),
      HEADER_LINK_LABEL: "Reservations",
      HERO_TITLE:
        heroTitle ||
        (isManual ? "New reservation request" : "You have a new reservation"),
      HERO_SUBTITLE:
        heroSubtitle ||
        (isManual
          ? `Hi ${hostName || "Host"}, a guest requested ${propertyName || "your property"}. Contact them to arrange payment — their phone is included below.`
          : `Hi ${hostName || "Host"}, a guest just booked ${propertyName || "your property"}. Here are the details.`),
      STATUS_BADGE:
        statusBadge || (isManual ? "Awaiting payment" : "New booking"),
      STATUS_BADGE_BG: statusBadgeBg || (isManual ? "#fffbeb" : "#eef2ff"),
      STATUS_BADGE_COLOR: statusBadgeColor || (isManual ? "#b45309" : "#4f46e5"),
      RECIPIENT_NAME: hostName || "Host",
      PROPERTY_NAME: propertyName || "Property",
      PROPERTY_IMAGE_URL:
        propertyImageUrl || propertyImageAbsoluteUrl(undefined),
      PROPERTY_URL: propertyUrl || siteUrl,
      PROPERTY_META: propertyMeta || locationLabel || "",
      STAY_LABEL: stayLabel,
      AMOUNT_LABEL: amountLabel,
      GUEST_LINE: guestLine,
      BOOKING_DETAILS_HTML: buildHostBookingDetailsHtml({
        guestLine,
        locationLabel,
        stayLabel,
        amountLabel,
        referenceId,
        previousStayLabel,
        extraRows: hostExtraRows,
      }),
      CTA_URL: ctaUrl || getAbsoluteAppUrl("/host/reservations"),
      CTA_LABEL: ctaLabel || "View reservations",
      SECONDARY_CTA_URL: getAbsoluteAppUrl("/properties/my-listings"),
      SECONDARY_CTA_LABEL: "My listings",
      SECONDARY_NOTE:
        secondaryNote ||
        (isManual
          ? "Message or call the guest to confirm payment details for this stay."
          : "Manage this stay from your host reservations dashboard."),
    },
    reservationReference,
  );
}

function resolveTemplateId(kind) {
  if (kind === "guest") {
    return process.env.RESEND_TEMPLATE_GUEST_ID || GUEST_TEMPLATE_ALIAS;
  }
  return process.env.RESEND_TEMPLATE_HOST_ID || HOST_TEMPLATE_ALIAS;
}

/**
 * @returns {Promise<{ sent: boolean, id?: string, error?: string, mode?: string }>}
 */
async function sendViaResend({
  to,
  subject,
  html,
  text,
  templateId,
  templateVariables,
  idempotencyKey,
  tags = [],
}) {
  const resend = getResend();
  const from = getEmailFrom();

  if (!resend) {
    return {
      sent: false,
      error: bookingEmailConfigError() || "Email not configured",
    };
  }

  const payload = {
    from,
    to: [to],
    subject,
    tags,
  };

  if (templateId && templateVariables) {
    payload.template = { id: templateId, variables: templateVariables };
    // Plain text still helps mobile clients / search when templates omit the ref.
    if (text) payload.text = text;
  } else {
    payload.html = html;
    if (text) payload.text = text;
  }

  const replyTo = getEmailReplyTo();
  if (replyTo) {
    payload.replyTo = replyTo;
  }

  // Resend SDK: idempotencyKey is a 2nd options arg (Idempotency-Key header), not body.
  const { data, error } = await resend.emails.send(
    payload,
    idempotencyKey ? { idempotencyKey } : {},
  );

  if (error) {
    console.error("[booking email] Resend send error:", {
      to,
      mode: templateId ? "template" : "html",
      templateId: templateId || null,
      message: error.message || String(error),
      name: error.name,
      statusCode: error.statusCode,
    });
    return { sent: false, error: error.message || String(error) };
  }

  console.info("[booking email] Sent", {
    to,
    mode: templateId ? "template" : "html",
    id: data?.id,
  });

  return {
    sent: true,
    id: data?.id,
    mode: templateId ? "template" : "html",
  };
}

/**
 * Send guest + host booking emails via Resend (dashboard templates when published, else rendered HTML).
 * Honors User.preferences.notifications unless payload.skipNotificationPrefs (force resend).
 */
export async function sendBookingConfirmationEmails(payload) {
  const gated = await applyNotificationPrefsToEmailPayload(
    payload,
    "confirmation",
  );
  const {
    guestEmail,
    guestName,
    guestPhone,
    hostEmail,
    hostName,
    propertyName,
    propertyId,
    propertyImageUrl,
    propertyMeta,
    locationLabel,
    checkIn,
    checkOut,
    nights,
    amount,
    currency,
    transactionId,
    paymentMode,
    /** Appended to Resend idempotency keys so force-resend is not cached. */
    idempotencySuffix,
  } = gated;

  const results = { guest: null, host: null };
  const prefsMeta = gated._notificationPrefs || {};
  if (prefsMeta.guestOptedOut) {
    results.guest = { sent: false, skipped: true, reason: "opted_out" };
  }
  if (prefsMeta.hostOptedOut) {
    results.host = { sent: false, skipped: true, reason: "opted_out" };
  }
  const configErr = bookingEmailConfigError();

  if (configErr) {
    console.error(`[booking email] ${configErr}`);
    return { enabled: false, error: configErr, results };
  }

  if (!guestEmail && !hostEmail) {
    // Opt-outs or missing addresses — not a hard failure when prefs cleared both.
    if (prefsMeta.guestOptedOut || prefsMeta.hostOptedOut) {
      return { enabled: true, results, prefsSkipped: true };
    }
    console.error(
      "[booking email] No guestEmail or hostEmail on booking payload — nothing to send",
    );
    return {
      enabled: true,
      error: "No recipient emails",
      results,
    };
  }

  const txKey = transactionId
    ? String(transactionId)
    : `${checkIn}-${checkOut}`;
  const idemSuffix = idempotencySuffix ? `/${idempotencySuffix}` : "";
  const baseTags = [
    { name: "category", value: "booking" },
    ...(transactionId
      ? [{ name: "transaction_id", value: String(transactionId) }]
      : []),
  ];

  const propertyUrl = propertyId
    ? await listingPublicUrlFor(propertyId)
    : getAbsoluteAppUrl("/properties");

  const shared = {
    propertyName,
    propertyId,
    propertyUrl,
    propertyImageUrl,
    propertyMeta,
    locationLabel,
    checkIn,
    checkOut,
    nights,
    amount,
    currency,
    transactionId,
    paymentMode,
    guestPhone,
  };

  const reservationReference = formatReservationReference(transactionId);
  const refSubjectSuffix = reservationReference
    ? ` (${reservationReference})`
    : "";
  const isManual = paymentMode === "manual";
  const subjectGuest = isManual
    ? `Reservation requested — ${propertyName || "Property"}${refSubjectSuffix}`
    : `Booking confirmed — ${propertyName || "Property"}${refSubjectSuffix}`;
  const subjectHost = isManual
    ? `Reservation request — ${propertyName || "Property"}${refSubjectSuffix}`
    : `New booking — ${propertyName || "Property"}${refSubjectSuffix}`;

  const guestVars = buildGuestTemplateVariables({
    guestName,
    ...shared,
  });
  const hostVars = buildHostTemplateVariables({
    hostName,
    guestName,
    guestEmail,
    guestPhone,
    ...shared,
  });

  const guestText = buildPlainTextBookingEmail({
    subject: subjectGuest,
    heroTitle: guestVars.HERO_TITLE,
    heroSubtitle: guestVars.HERO_SUBTITLE,
    propertyName,
    stayLabel: guestVars.STAY_LABEL,
    amountLabel: guestVars.AMOUNT_LABEL,
    reservationReference: guestVars.RESERVATION_REFERENCE,
    locationLabel,
  });
  const hostText = buildPlainTextBookingEmail({
    subject: subjectHost,
    heroTitle: hostVars.HERO_TITLE,
    heroSubtitle: hostVars.HERO_SUBTITLE,
    propertyName,
    stayLabel: hostVars.STAY_LABEL,
    amountLabel: hostVars.AMOUNT_LABEL,
    reservationReference: hostVars.RESERVATION_REFERENCE,
    locationLabel,
    guestLine: formatGuestLine(guestName, guestEmail, guestPhone),
  });

  const guestTemplateId = resolveTemplateId("guest");
  const hostTemplateId = resolveTemplateId("host");
  // Only use Resend templates when an explicit ID is set (aliases often 404).
  // Dashboard templates must include {{{RESERVATION_REFERENCE}}} (and ideally
  // {{{RESERVATION_REFERENCE_HTML}}}) — HTML fallback always shows the ref banner.
  const useGuestTemplate = Boolean(process.env.RESEND_TEMPLATE_GUEST_ID);
  const useHostTemplate = Boolean(process.env.RESEND_TEMPLATE_HOST_ID);
  if (
    process.env.RESEND_TEMPLATES_READY === "true" &&
    !useGuestTemplate &&
    !useHostTemplate
  ) {
    console.warn(
      "[booking email] RESEND_TEMPLATES_READY=true but no RESEND_TEMPLATE_*_ID — using HTML",
    );
  }

  if (guestEmail) {
    results.guest = await sendViaResend({
      to: guestEmail,
      subject: subjectGuest,
      templateId: useGuestTemplate ? guestTemplateId : undefined,
      templateVariables: useGuestTemplate ? guestVars : undefined,
      html: renderGuestBookingEmailHtml(guestVars),
      text: guestText,
      idempotencyKey: `booking-confirm/${txKey}/guest${idemSuffix}`,
      tags: [...baseTags, { name: "recipient", value: "guest" }],
    });

    if (!results.guest.sent && useGuestTemplate) {
      console.warn(
        "[booking email] Guest template failed; falling back to HTML",
        results.guest.error,
      );
      results.guest = await sendViaResend({
        to: guestEmail,
        subject: subjectGuest,
        html: renderGuestBookingEmailHtml(guestVars),
        text: guestText,
        idempotencyKey: `booking-confirm/${txKey}/guest-html${idemSuffix}`,
        tags: [...baseTags, { name: "recipient", value: "guest" }],
      });
    }
  } else {
    console.warn("[booking email] Guest email missing — guest mail skipped");
  }

  if (hostEmail && hostEmail !== guestEmail) {
    results.host = await sendViaResend({
      to: hostEmail,
      subject: subjectHost,
      templateId: useHostTemplate ? hostTemplateId : undefined,
      templateVariables: useHostTemplate ? hostVars : undefined,
      html: renderHostBookingEmailHtml(hostVars),
      text: hostText,
      idempotencyKey: `booking-confirm/${txKey}/host${idemSuffix}`,
      tags: [...baseTags, { name: "recipient", value: "host" }],
    });

    if (!results.host.sent && useHostTemplate) {
      console.warn(
        "[booking email] Host template failed; falling back to HTML",
        results.host.error,
      );
      results.host = await sendViaResend({
        to: hostEmail,
        subject: subjectHost,
        html: renderHostBookingEmailHtml(hostVars),
        text: hostText,
        idempotencyKey: `booking-confirm/${txKey}/host-html${idemSuffix}`,
        tags: [...baseTags, { name: "recipient", value: "host" }],
      });
    }
  } else if (!hostEmail) {
    console.warn("[booking email] Host email missing — host mail skipped");
  }

  return { enabled: true, results };
}

/**
 * Shared guest+host HTML send (modify / cancel). Uses same layout as confirm;
 * dashboard templates optional via RESEND_TEMPLATE_*_ID.
 */
async function sendGuestHostLifecyclePair({
  guestEmail,
  hostEmail,
  subjectGuest,
  subjectHost,
  guestVars,
  hostVars,
  guestText,
  hostText,
  idempotencyPrefix,
  idempotencySuffix,
  transactionId,
  categoryTag,
  prefsMeta = {},
}) {
  const results = { guest: null, host: null };
  if (prefsMeta.guestOptedOut) {
    results.guest = { sent: false, skipped: true, reason: "opted_out" };
  }
  if (prefsMeta.hostOptedOut) {
    results.host = { sent: false, skipped: true, reason: "opted_out" };
  }

  const configErr = bookingEmailConfigError();
  if (configErr) {
    console.error(`[booking email] ${configErr}`);
    return { enabled: false, error: configErr, results };
  }
  if (!guestEmail && !hostEmail) {
    if (prefsMeta.guestOptedOut || prefsMeta.hostOptedOut) {
      return { enabled: true, results, prefsSkipped: true };
    }
    return { enabled: true, error: "No recipient emails", results };
  }

  const txKey = transactionId
    ? String(transactionId)
    : idempotencyPrefix;
  const idemSuffix = idempotencySuffix ? `/${idempotencySuffix}` : "";
  const baseTags = [
    { name: "category", value: categoryTag || "booking" },
    ...(transactionId
      ? [{ name: "transaction_id", value: String(transactionId) }]
      : []),
  ];

  const useGuestTemplate = Boolean(process.env.RESEND_TEMPLATE_GUEST_ID);
  const useHostTemplate = Boolean(process.env.RESEND_TEMPLATE_HOST_ID);
  const guestTemplateId = resolveTemplateId("guest");
  const hostTemplateId = resolveTemplateId("host");

  if (guestEmail) {
    results.guest = await sendViaResend({
      to: guestEmail,
      subject: subjectGuest,
      templateId: useGuestTemplate ? guestTemplateId : undefined,
      templateVariables: useGuestTemplate ? guestVars : undefined,
      html: renderGuestBookingEmailHtml(guestVars),
      text: guestText,
      idempotencyKey: `${idempotencyPrefix}/${txKey}/guest${idemSuffix}`,
      tags: [...baseTags, { name: "recipient", value: "guest" }],
    });
    if (!results.guest.sent && useGuestTemplate) {
      results.guest = await sendViaResend({
        to: guestEmail,
        subject: subjectGuest,
        html: renderGuestBookingEmailHtml(guestVars),
        text: guestText,
        idempotencyKey: `${idempotencyPrefix}/${txKey}/guest-html${idemSuffix}`,
        tags: [...baseTags, { name: "recipient", value: "guest" }],
      });
    }
  }

  if (hostEmail && hostEmail !== guestEmail) {
    results.host = await sendViaResend({
      to: hostEmail,
      subject: subjectHost,
      templateId: useHostTemplate ? hostTemplateId : undefined,
      templateVariables: useHostTemplate ? hostVars : undefined,
      html: renderHostBookingEmailHtml(hostVars),
      text: hostText,
      idempotencyKey: `${idempotencyPrefix}/${txKey}/host${idemSuffix}`,
      tags: [...baseTags, { name: "recipient", value: "host" }],
    });
    if (!results.host.sent && useHostTemplate) {
      results.host = await sendViaResend({
        to: hostEmail,
        subject: subjectHost,
        html: renderHostBookingEmailHtml(hostVars),
        text: hostText,
        idempotencyKey: `${idempotencyPrefix}/${txKey}/host-html${idemSuffix}`,
        tags: [...baseTags, { name: "recipient", value: "host" }],
      });
    }
  }

  return { enabled: true, results };
}

/**
 * Dates changed — notify guest + host.
 * Honors notification prefs unless payload.skipNotificationPrefs.
 */
export async function sendBookingModifiedEmails(payload) {
  const gated = await applyNotificationPrefsToEmailPayload(payload, "modified");
  const {
    guestEmail,
    guestName,
    hostEmail,
    hostName,
    propertyName,
    propertyId,
    propertyImageUrl,
    propertyMeta,
    locationLabel,
    checkIn,
    checkOut,
    nights,
    amount,
    currency,
    transactionId,
    previousCheckIn,
    previousCheckOut,
    previousPropertyName,
    changedBy,
    idempotencySuffix,
  } = gated;

  const propertyUrl = propertyId
    ? await listingPublicUrlFor(propertyId)
    : getAbsoluteAppUrl("/properties");

  const shared = {
    propertyName,
    propertyId,
    propertyUrl,
    propertyImageUrl,
    propertyMeta,
    locationLabel,
    checkIn,
    checkOut,
    nights,
    amount,
    currency,
    previousCheckIn,
    previousCheckOut,
    transactionId,
  };

  const movedListing =
    previousPropertyName &&
    propertyName &&
    String(previousPropertyName) !== String(propertyName);
  const byLabel = changedBy === "host" ? "your host" : "you";
  const guestVars = buildGuestTemplateVariables({
    guestName,
    ...shared,
    previewText: movedListing
      ? `Your stay was moved to ${propertyName}.`
      : `Your stay dates at ${propertyName || "the property"} were updated.`,
    heroTitle: movedListing
      ? "Your stay was moved"
      : "Your reservation was updated",
    heroSubtitle: movedListing
      ? `Hi ${guestName || "there"}, ${byLabel} moved your reservation from ${previousPropertyName} to ${propertyName}. Your dates are unchanged.`
      : `Hi ${guestName || "there"}, the dates for ${propertyName || "your stay"} were changed by ${byLabel}. Please review the new stay below.`,
    statusBadge: movedListing ? "Moved" : "Updated",
    statusBadgeBg: "#eff6ff",
    statusBadgeColor: "#1d4ed8",
    secondaryNote:
      "If you did not expect this change, reply to this email or contact support.",
  });

  const hostVars = buildHostTemplateVariables({
    hostName,
    guestName,
    guestEmail,
    ...shared,
    previewText: movedListing
      ? `Stay moved to ${propertyName || "your listing"}.`
      : `Reservation dates updated for ${propertyName || "your listing"}.`,
    heroTitle: movedListing
      ? "Reservation moved to another listing"
      : "Reservation dates updated",
    heroSubtitle: movedListing
      ? `Hi ${hostName || "Host"}, you moved this stay from ${previousPropertyName} to ${propertyName || "your property"}. Dates are unchanged.`
      : `Hi ${hostName || "Host"}, stay dates for ${propertyName || "your property"} were updated (${changedBy === "guest" ? "by the guest" : "by you"}).`,
    statusBadge: movedListing ? "Moved" : "Updated",
    statusBadgeBg: "#eff6ff",
    statusBadgeColor: "#1d4ed8",
  });

  const refSuffix = guestVars.RESERVATION_REFERENCE
    ? ` (${guestVars.RESERVATION_REFERENCE})`
    : "";
  const subjectGuest = `Reservation updated — ${propertyName || "Property"}${refSuffix}`;
  const subjectHost = `Reservation updated — ${propertyName || "Property"}${refSuffix}`;

  return sendGuestHostLifecyclePair({
    guestEmail,
    hostEmail,
    subjectGuest,
    subjectHost,
    guestVars,
    hostVars,
    guestText: buildPlainTextBookingEmail({
      subject: subjectGuest,
      heroTitle: guestVars.HERO_TITLE,
      heroSubtitle: guestVars.HERO_SUBTITLE,
      propertyName,
      stayLabel: guestVars.STAY_LABEL,
      amountLabel: guestVars.AMOUNT_LABEL,
      reservationReference: guestVars.RESERVATION_REFERENCE,
      locationLabel,
    }),
    hostText: buildPlainTextBookingEmail({
      subject: subjectHost,
      heroTitle: hostVars.HERO_TITLE,
      heroSubtitle: hostVars.HERO_SUBTITLE,
      propertyName,
      stayLabel: hostVars.STAY_LABEL,
      amountLabel: hostVars.AMOUNT_LABEL,
      reservationReference: hostVars.RESERVATION_REFERENCE,
      locationLabel,
      guestLine: formatGuestLine(guestName, guestEmail),
    }),
    idempotencyPrefix: "booking-modified",
    idempotencySuffix,
    transactionId,
    categoryTag: "booking-modified",
    prefsMeta: gated._notificationPrefs || {},
  });
}

/**
 * Cancellation — notify guest + host.
 * Honors notification prefs unless payload.skipNotificationPrefs.
 */
export async function sendBookingCancelledEmails(payload) {
  const gated = await applyNotificationPrefsToEmailPayload(
    payload,
    "cancelled",
  );
  const {
    guestEmail,
    guestName,
    hostEmail,
    hostName,
    propertyName,
    propertyId,
    propertyImageUrl,
    propertyMeta,
    locationLabel,
    checkIn,
    checkOut,
    nights,
    amount,
    currency,
    transactionId,
    cancelledBy,
    cancellationReason,
    refundEligible,
    idempotencySuffix,
  } = gated;

  const propertyUrl = propertyId
    ? await listingPublicUrlFor(propertyId)
    : getAbsoluteAppUrl("/properties");

  const extraDetailRows = [];
  if (cancellationReason) {
    extraDetailRows.push({
      label: "Reason",
      value: String(cancellationReason),
    });
  }
  if (refundEligible) {
    extraDetailRows.push({
      label: "Refund",
      value: "Eligible — processing if payment was captured",
    });
  }

  const shared = {
    propertyName,
    propertyId,
    propertyUrl,
    propertyImageUrl,
    propertyMeta,
    locationLabel,
    checkIn,
    checkOut,
    nights,
    amount,
    currency,
    transactionId,
    extraDetailRows,
  };

  const byGuest = cancelledBy === "guest";
  const guestVars = buildGuestTemplateVariables({
    guestName,
    ...shared,
    previewText: `Your reservation at ${propertyName || "the property"} was cancelled.`,
    heroTitle: "Reservation cancelled",
    heroSubtitle: `Hi ${guestName || "there"}, your stay at ${propertyName || "the property"} has been cancelled${byGuest ? "" : " by the host"}.`,
    statusBadge: "Cancelled",
    statusBadgeBg: "#fef2f2",
    statusBadgeColor: "#b91c1c",
    secondaryNote: refundEligible
      ? "If a refund applies, it will be processed according to the listing policy."
      : "Questions? Reply to this email or visit your bookings.",
  });

  const hostVars = buildHostTemplateVariables({
    hostName,
    guestName,
    guestEmail,
    ...shared,
    previewText: `A reservation for ${propertyName || "your listing"} was cancelled.`,
    heroTitle: "Reservation cancelled",
    heroSubtitle: `Hi ${hostName || "Host"}, a booking for ${propertyName || "your property"} was cancelled${byGuest ? " by the guest" : " (by you)"}.`,
    statusBadge: "Cancelled",
    statusBadgeBg: "#fef2f2",
    statusBadgeColor: "#b91c1c",
  });

  const refSuffix = guestVars.RESERVATION_REFERENCE
    ? ` (${guestVars.RESERVATION_REFERENCE})`
    : "";
  const subjectGuest = `Reservation cancelled — ${propertyName || "Property"}${refSuffix}`;
  const subjectHost = `Reservation cancelled — ${propertyName || "Property"}${refSuffix}`;

  return sendGuestHostLifecyclePair({
    guestEmail,
    hostEmail,
    subjectGuest,
    subjectHost,
    guestVars,
    hostVars,
    guestText: buildPlainTextBookingEmail({
      subject: subjectGuest,
      heroTitle: guestVars.HERO_TITLE,
      heroSubtitle: guestVars.HERO_SUBTITLE,
      propertyName,
      stayLabel: guestVars.STAY_LABEL,
      amountLabel: guestVars.AMOUNT_LABEL,
      reservationReference: guestVars.RESERVATION_REFERENCE,
      locationLabel,
    }),
    hostText: buildPlainTextBookingEmail({
      subject: subjectHost,
      heroTitle: hostVars.HERO_TITLE,
      heroSubtitle: hostVars.HERO_SUBTITLE,
      propertyName,
      stayLabel: hostVars.STAY_LABEL,
      amountLabel: hostVars.AMOUNT_LABEL,
      reservationReference: hostVars.RESERVATION_REFERENCE,
      locationLabel,
      guestLine: formatGuestLine(guestName, guestEmail),
    }),
    idempotencyPrefix: "booking-cancelled",
    idempotencySuffix,
    transactionId,
    categoryTag: "booking-cancelled",
    prefsMeta: gated._notificationPrefs || {},
  });
}

export {
  buildGuestTemplateVariables,
  buildHostTemplateVariables,
  formatPropertyLocation,
  formatPropertyMeta,
  propertyImageAbsoluteUrl,
};
