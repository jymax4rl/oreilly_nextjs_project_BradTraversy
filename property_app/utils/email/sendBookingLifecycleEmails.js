import { Resend } from "resend";
import {
  bookingDetailRowHtml,
  renderGuestBookingEmailHtml,
  renderHostBookingEmailHtml,
} from "@/utils/email/bookingEmailTemplateHtml";
import { brandLogoUrl } from "@/utils/appUrl";
import { getBookingResendApiKey } from "@/utils/email/resendKeys";
import {
  formatPropertyLocation,
  getAbsoluteAppUrl,
  propertyImageAbsoluteUrl,
} from "@/utils/email/propertyImageUrl";
import { formatPropertyMeta } from "@/utils/email/propertyMeta";
import { formatGuestDate } from "@/utils/availability/validateStay";

let resendClient = null;

function getResend() {
  const apiKey = getBookingResendApiKey();
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

async function sendViaResend({ to, subject, html, idempotencyKey, tags = [] }) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) {
    return { sent: false, error: "Email not configured" };
  }
  const payload = {
    from,
    to: [to],
    subject,
    html,
    tags,
    idempotencyKey,
  };
  if (process.env.EMAIL_REPLY_TO) {
    payload.replyTo = process.env.EMAIL_REPLY_TO;
  }
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    console.error("Resend lifecycle email error:", error);
    return { sent: false, error: error.message || String(error) };
  }
  return { sent: true, id: data?.id };
}

function formatStayLabel(checkIn, checkOut, nights) {
  const a = formatGuestDate(checkIn);
  const b = formatGuestDate(checkOut);
  return `${a} → ${b} (${nights} night${nights !== 1 ? "s" : ""})`;
}

function formatAmount(amount, currency) {
  if (amount == null || !currency) return "—";
  return `${currency} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildLifecycleGuestVars({
  guestName,
  propertyName,
  propertyId,
  property,
  heroTitle,
  heroSubtitle,
  statusBadge,
  statusBg,
  statusColor,
  stayLabel,
  amountLabel,
  detailsHtml,
  ctaUrl,
  ctaLabel,
  secondaryNote,
}) {
  const siteUrl = getAbsoluteAppUrl();
  const propertyUrl = propertyId
    ? getAbsoluteAppUrl(`/properties/${propertyId}`)
    : siteUrl;
  const locationLabel = property ? formatPropertyLocation(property.location) : "";
  const propertyMeta = property ? formatPropertyMeta(property) : "";

  return {
    APP_URL: siteUrl,
    LOGO_URL: brandLogoUrl(),
    PREVIEW_TEXT: heroSubtitle,
    HEADER_LINK_URL: getAbsoluteAppUrl("/properties"),
    HEADER_LINK_LABEL: "View listings",
    HERO_TITLE: heroTitle,
    HERO_SUBTITLE: heroSubtitle,
    STATUS_BADGE: statusBadge,
    STATUS_BADGE_BG: statusBg,
    STATUS_BADGE_COLOR: statusColor,
    RECIPIENT_NAME: guestName || "there",
    PROPERTY_NAME: propertyName || "Property",
    PROPERTY_IMAGE_URL: propertyImageAbsoluteUrl(property?.images),
    PROPERTY_URL: propertyUrl,
    PROPERTY_META: propertyMeta || locationLabel,
    STAY_LABEL: stayLabel,
    AMOUNT_LABEL: amountLabel,
    BOOKING_DETAILS_HTML: detailsHtml,
    CTA_URL: ctaUrl,
    CTA_LABEL: ctaLabel,
    SECONDARY_CTA_URL: getAbsoluteAppUrl("/properties"),
    SECONDARY_CTA_LABEL: "Browse all listings",
    SECONDARY_NOTE: secondaryNote,
  };
}

export async function sendBookingModifiedEmails(payload) {
  const {
    booking,
    property,
    guestEmail,
    guestName,
    hostEmail,
    hostName,
    previousCheckIn,
    previousCheckOut,
    checkIn,
    checkOut,
    nights,
    amount,
    currency,
    priceDelta,
  } = payload;

  const results = { guest: null, host: null };
  if (!getBookingResendApiKey() || !process.env.EMAIL_FROM) {
    return { enabled: false, results };
  }

  const propertyName = booking.propertyName || property?.name || "Property";
  const propertyId = String(booking.propertyId);
  const txKey = booking.transactionId || booking._id;
  const oldStay = formatStayLabel(previousCheckIn, previousCheckOut, nights);
  const newStay = formatStayLabel(checkIn, checkOut, nights);
  const deltaLabel =
    priceDelta != null && priceDelta !== 0
      ? `${priceDelta > 0 ? "+" : ""}${formatAmount(priceDelta, currency || "USD")} vs previous total`
      : "No price change calculated";

  const guestDetails = [
    bookingDetailRowHtml({ label: "Previous stay", value: oldStay }),
    bookingDetailRowHtml({ label: "New stay", value: `<strong>${newStay}</strong>` }),
    bookingDetailRowHtml({
      label: "Updated total",
      value: `<strong>${formatAmount(amount, currency)}</strong>`,
    }),
    bookingDetailRowHtml({ label: "Price change", value: deltaLabel }),
  ].join("");

  const guestVars = buildLifecycleGuestVars({
    guestName,
    propertyName,
    propertyId,
    property,
    heroTitle: "Your stay dates were updated",
    heroSubtitle: `Hi ${guestName || "there"}, your reservation at ${propertyName} has new dates.`,
    statusBadge: "Modified",
    statusBg: "#eff6ff",
    statusColor: "#2563eb",
    stayLabel: newStay,
    amountLabel: formatAmount(amount, currency),
    detailsHtml: guestDetails,
    ctaUrl: getAbsoluteAppUrl("/my-bookings"),
    ctaLabel: "View my bookings",
    secondaryNote: "Need help? Reply to this email.",
  });

  if (guestEmail) {
    results.guest = await sendViaResend({
      to: guestEmail,
      subject: `Stay dates updated — ${propertyName}`,
      html: renderGuestBookingEmailHtml(guestVars),
      idempotencyKey: `booking-modified/${txKey}/guest`,
      tags: [{ name: "category", value: "booking-modified" }],
    });
  }

  if (hostEmail && hostEmail !== guestEmail) {
    const hostVars = buildLifecycleGuestVars({
      guestName: hostName,
      propertyName,
      propertyId,
      property,
      heroTitle: "A reservation was modified",
      heroSubtitle: `${guestName || "A guest"} changed their stay dates for ${propertyName}.`,
      statusBadge: "Modified",
      statusBg: "#eff6ff",
      statusColor: "#2563eb",
      stayLabel: newStay,
      amountLabel: formatAmount(amount, currency),
      detailsHtml: [
        bookingDetailRowHtml({
          label: "Guest",
          value: `${guestName || "Guest"}${guestEmail ? ` (${guestEmail})` : ""}`,
        }),
        bookingDetailRowHtml({ label: "Previous stay", value: oldStay }),
        bookingDetailRowHtml({ label: "New stay", value: `<strong>${newStay}</strong>` }),
      ].join(""),
      ctaUrl: getAbsoluteAppUrl(`/properties/${propertyId}/calendar`),
      ctaLabel: "Open host calendar",
      secondaryNote: "Review the updated reservation on your calendar.",
    });

    results.host = await sendViaResend({
      to: hostEmail,
      subject: `Booking modified — ${propertyName}`,
      html: renderHostBookingEmailHtml(hostVars),
      idempotencyKey: `booking-modified/${txKey}/host`,
      tags: [{ name: "category", value: "booking-modified" }],
    });
  }

  return { enabled: true, results };
}

export async function sendBookingCancelledEmails(payload) {
  const {
    booking,
    property,
    guestEmail,
    guestName,
    hostEmail,
    hostName,
    cancelledBy,
    refundLabel,
  } = payload;

  const results = { guest: null, host: null };
  if (!getBookingResendApiKey() || !process.env.EMAIL_FROM) {
    return { enabled: false, results };
  }

  const propertyName = booking.propertyName || property?.name || "Property";
  const propertyId = String(booking.propertyId);
  const txKey = booking.transactionId || booking._id;
  const nights =
    booking.checkIn && booking.checkOut
      ? Math.max(
          0,
          Math.round(
            (new Date(booking.checkOut) - new Date(booking.checkIn)) /
              (24 * 60 * 60 * 1000),
          ),
        )
      : 0;
  const stayLabel = formatStayLabel(booking.checkIn, booking.checkOut, nights);

  const cancelledByLabel =
    cancelledBy === "host"
      ? "The host cancelled this reservation."
      : "You cancelled this reservation.";

  const guestDetails = [
    bookingDetailRowHtml({ label: "Stay", value: stayLabel }),
    bookingDetailRowHtml({
      label: "Refund",
      value: refundLabel || "See cancellation policy",
    }),
    bookingDetailRowHtml({ label: "Status", value: "<strong>Cancelled</strong>" }),
  ].join("");

  const guestVars = buildLifecycleGuestVars({
    guestName,
    propertyName,
    propertyId,
    property,
    heroTitle: "Your booking was cancelled",
    heroSubtitle: `Hi ${guestName || "there"}, ${cancelledByLabel}`,
    statusBadge: "Cancelled",
    statusBg: "#fef2f2",
    statusColor: "#dc2626",
    stayLabel,
    amountLabel: formatAmount(booking.amount, booking.currency),
    detailsHtml: guestDetails,
    ctaUrl: getAbsoluteAppUrl("/my-bookings"),
    ctaLabel: "View my bookings",
    secondaryNote: refundLabel || "Questions? Reply to this email.",
  });

  if (guestEmail) {
    results.guest = await sendViaResend({
      to: guestEmail,
      subject: `Booking cancelled — ${propertyName}`,
      html: renderGuestBookingEmailHtml(guestVars),
      idempotencyKey: `booking-cancelled/${txKey}/guest`,
      tags: [{ name: "category", value: "booking-cancelled" }],
    });
  }

  if (hostEmail && hostEmail !== guestEmail) {
    const hostVars = buildLifecycleGuestVars({
      guestName: hostName,
      propertyName,
      propertyId,
      property,
      heroTitle:
        cancelledBy === "host"
          ? "You cancelled a reservation"
          : "Guest cancelled a reservation",
      heroSubtitle:
        cancelledBy === "host"
          ? `You cancelled ${guestName || "a guest"}'s stay at ${propertyName}.`
          : `${guestName || "A guest"} cancelled their stay at ${propertyName}.`,
      statusBadge: "Cancelled",
      statusBg: "#fef2f2",
      statusColor: "#dc2626",
      stayLabel,
      amountLabel: formatAmount(booking.amount, booking.currency),
      detailsHtml: [
        bookingDetailRowHtml({
          label: "Guest",
          value: `${guestName || "Guest"}${guestEmail ? ` (${guestEmail})` : ""}`,
        }),
        bookingDetailRowHtml({ label: "Stay", value: stayLabel }),
      ].join(""),
      ctaUrl: getAbsoluteAppUrl(`/properties/${propertyId}/calendar`),
      ctaLabel: "Open host calendar",
      secondaryNote: "Those dates are now available on your calendar.",
    });

    results.host = await sendViaResend({
      to: hostEmail,
      subject: `Booking cancelled — ${propertyName}`,
      html: renderHostBookingEmailHtml(hostVars),
      idempotencyKey: `booking-cancelled/${txKey}/host`,
      tags: [{ name: "category", value: "booking-cancelled" }],
    });
  }

  return { enabled: true, results };
}
