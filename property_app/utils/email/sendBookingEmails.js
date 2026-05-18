import { Resend } from "resend";
import {
  GUEST_TEMPLATE_ALIAS,
  HOST_TEMPLATE_ALIAS,
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

let resendClient = null;

function getResend() {
  const apiKey = getBookingResendApiKey();
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
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

function formatGuestLine(guestName, guestEmail) {
  const name = guestName || "Guest";
  if (!guestEmail) return name;
  return `${name} (${guestEmail})`;
}

function buildGuestBookingDetailsHtml({
  locationLabel,
  stayLabel,
  amountLabel,
  referenceId,
}) {
  const rows = [
    bookingDetailRowHtml({ label: "Location", value: locationLabel || "—" }),
    bookingDetailRowHtml({ label: "Stay", value: `<strong>${stayLabel}</strong>` }),
    bookingDetailRowHtml({ label: "Total paid", value: `<strong>${amountLabel}</strong>` }),
  ];
  if (referenceId && referenceId !== "—") {
    rows.push(
      bookingDetailRowHtml({ label: "Reference", value: referenceId }),
    );
  }
  return rows.join("");
}

function buildHostBookingDetailsHtml({
  guestLine,
  locationLabel,
  stayLabel,
  amountLabel,
}) {
  return [
    bookingDetailRowHtml({ label: "Guest", value: guestLine }),
    bookingDetailRowHtml({ label: "Location", value: locationLabel || "—" }),
    bookingDetailRowHtml({ label: "Stay", value: `<strong>${stayLabel}</strong>` }),
    bookingDetailRowHtml({ label: "Amount", value: `<strong>${amountLabel}</strong>` }),
  ].join("");
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
  } = payload;

  const stayLabel = formatStayLabel(checkIn, checkOut, nights);
  const amountLabel = formatAmountLabel(amount, currency, { guest: true });
  const referenceId = transactionId ? String(transactionId) : "—";
  const siteUrl = getAbsoluteAppUrl();

  return {
    APP_URL: siteUrl,
    LOGO_URL: brandLogoUrl(),
    PREVIEW_TEXT: `Your booking at ${propertyName || "your property"} is confirmed.`,
    HEADER_LINK_URL: getAbsoluteAppUrl("/properties"),
    HEADER_LINK_LABEL: "View listings",
    HERO_TITLE: "You're all set for your stay",
    HERO_SUBTITLE: `Hi ${guestName || "there"}, your reservation at ${propertyName || "the property"} is confirmed. We look forward to hosting you.`,
    STATUS_BADGE: "Confirmed",
    STATUS_BADGE_BG: "#ecfdf5",
    STATUS_BADGE_COLOR: "#059669",
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
    }),
    CTA_URL: getAbsoluteAppUrl("/my-bookings"),
    CTA_LABEL: "View my bookings",
    SECONDARY_CTA_URL: getAbsoluteAppUrl("/properties"),
    SECONDARY_CTA_LABEL: "Browse all listings",
    SECONDARY_NOTE:
      "Questions about your stay? Reply to this email or visit your dashboard.",
  };
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
    checkIn,
    checkOut,
    nights,
    amount,
    currency,
  } = payload;

  const stayLabel = formatStayLabel(checkIn, checkOut, nights);
  const amountLabel = formatAmountLabel(amount, currency);
  const guestLine = formatGuestLine(guestName, guestEmail);
  const siteUrl = getAbsoluteAppUrl();

  return {
    APP_URL: siteUrl,
    LOGO_URL: brandLogoUrl(),
    PREVIEW_TEXT: `New booking for ${propertyName || "your listing"}.`,
    HEADER_LINK_URL: getAbsoluteAppUrl("/properties/my-listings"),
    HEADER_LINK_LABEL: "My listings",
    HERO_TITLE: "You have a new reservation",
    HERO_SUBTITLE: `Hi ${hostName || "Host"}, a guest just booked ${propertyName || "your property"}. Here are the details.`,
    STATUS_BADGE: "New booking",
    STATUS_BADGE_BG: "#eef2ff",
    STATUS_BADGE_COLOR: "#4f46e5",
    RECIPIENT_NAME: hostName || "Host",
    PROPERTY_NAME: propertyName || "Property",
    PROPERTY_IMAGE_URL:
      propertyImageUrl || propertyImageAbsoluteUrl(undefined),
    PROPERTY_URL: propertyUrl || siteUrl,
    PROPERTY_META: propertyMeta || locationLabel || "",
    STAY_LABEL: stayLabel,
    AMOUNT_LABEL: amountLabel,
    BOOKING_DETAILS_HTML: buildHostBookingDetailsHtml({
      guestLine,
      locationLabel,
      stayLabel,
      amountLabel,
    }),
    CTA_URL: getAbsoluteAppUrl("/properties/my-listings"),
    CTA_LABEL: "My listings",
    SECONDARY_CTA_URL: getAbsoluteAppUrl("/properties"),
    SECONDARY_CTA_LABEL: "Browse all listings",
    SECONDARY_NOTE:
      "Manage reservations and availability from your host dashboard.",
  };
}

function resolveTemplateId(kind) {
  if (kind === "guest") {
    return process.env.RESEND_TEMPLATE_GUEST_ID || GUEST_TEMPLATE_ALIAS;
  }
  return process.env.RESEND_TEMPLATE_HOST_ID || HOST_TEMPLATE_ALIAS;
}

/**
 * @param {object} params
 * @returns {Promise<{ sent: boolean, id?: string, error?: string }>}
 */
async function sendViaResend({
  to,
  subject,
  html,
  templateId,
  templateVariables,
  idempotencyKey,
  tags = [],
}) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;

  if (!resend || !from) {
    return {
      sent: false,
      error: "RESEND_BOOKING_API_KEY (or RESEND_API_KEY) or EMAIL_FROM not set",
    };
  }

  const payload = {
    from,
    to: [to],
    subject,
    tags,
    idempotencyKey,
  };

  if (templateId && templateVariables) {
    payload.template = { id: templateId, variables: templateVariables };
  } else {
    payload.html = html;
  }

  if (process.env.EMAIL_REPLY_TO) {
    payload.replyTo = process.env.EMAIL_REPLY_TO;
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    console.error("Resend send error:", error);
    return { sent: false, error: error.message || String(error) };
  }

  return { sent: true, id: data?.id };
}

/**
 * Send guest + host booking emails via Resend (dashboard templates when published, else rendered HTML).
 */
export async function sendBookingConfirmationEmails(payload) {
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
  } = payload;

  const results = { guest: null, host: null };

  if (!getBookingResendApiKey() || !process.env.EMAIL_FROM) {
    console.info(
      "[booking email] Skipped — set RESEND_BOOKING_API_KEY (Sending access) and EMAIL_FROM in Vercel.",
    );
    return { enabled: false, results };
  }

  const txKey = transactionId ? String(transactionId) : `${checkIn}-${checkOut}`;
  const baseTags = [
    { name: "category", value: "booking" },
    ...(transactionId
      ? [{ name: "transaction_id", value: String(transactionId) }]
      : []),
  ];

  const propertyUrl = propertyId
    ? getAbsoluteAppUrl(`/properties/${propertyId}`)
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
  };

  const subjectGuest = `Booking confirmed — ${propertyName}`;
  const subjectHost = `New booking — ${propertyName}`;

  const guestVars = buildGuestTemplateVariables({
    guestName,
    ...shared,
    transactionId,
  });
  const hostVars = buildHostTemplateVariables({
    hostName,
    guestName,
    guestEmail,
    ...shared,
  });

  const guestTemplateId = resolveTemplateId("guest");
  const hostTemplateId = resolveTemplateId("host");
  const useTemplates =
    process.env.RESEND_TEMPLATES_READY === "true" ||
    Boolean(
      process.env.RESEND_TEMPLATE_GUEST_ID ||
        process.env.RESEND_TEMPLATE_HOST_ID,
    );

  if (guestEmail) {
    results.guest = await sendViaResend({
      to: guestEmail,
      subject: subjectGuest,
      templateId: useTemplates ? guestTemplateId : undefined,
      templateVariables: useTemplates ? guestVars : undefined,
      html: renderGuestBookingEmailHtml(guestVars),
      idempotencyKey: `booking-confirm/${txKey}/guest`,
      tags: [...baseTags, { name: "recipient", value: "guest" }],
    });

    if (!results.guest.sent && useTemplates) {
      results.guest = await sendViaResend({
        to: guestEmail,
        subject: subjectGuest,
        html: renderGuestBookingEmailHtml(guestVars),
        idempotencyKey: `booking-confirm/${txKey}/guest-html`,
        tags: [...baseTags, { name: "recipient", value: "guest" }],
      });
    }
  }

  if (hostEmail && hostEmail !== guestEmail) {
    results.host = await sendViaResend({
      to: hostEmail,
      subject: subjectHost,
      templateId: useTemplates ? hostTemplateId : undefined,
      templateVariables: useTemplates ? hostVars : undefined,
      html: renderHostBookingEmailHtml(hostVars),
      idempotencyKey: `booking-confirm/${txKey}/host`,
      tags: [...baseTags, { name: "recipient", value: "host" }],
    });

    if (!results.host.sent && useTemplates) {
      results.host = await sendViaResend({
        to: hostEmail,
        subject: subjectHost,
        html: renderHostBookingEmailHtml(hostVars),
        idempotencyKey: `booking-confirm/${txKey}/host-html`,
        tags: [...baseTags, { name: "recipient", value: "host" }],
      });
    }
  }

  return { enabled: true, results };
}

export {
  buildGuestTemplateVariables,
  buildHostTemplateVariables,
  formatPropertyLocation,
  formatPropertyMeta,
  propertyImageAbsoluteUrl,
};
