import { DEFAULT_PRODUCTION_APP_URL, brandLogoUrl } from "@/utils/appUrl";

const APP_NAME = "Kama Properties";
const APP_URL = DEFAULT_PRODUCTION_APP_URL;
const DEFAULT_LOGO_URL = brandLogoUrl();

export const GUEST_TEMPLATE_ALIAS = "kama-booking-guest";
export const HOST_TEMPLATE_ALIAS = "kama-booking-host";

const SHARED_VARIABLES = [
  { key: "APP_URL", type: "string", fallbackValue: APP_URL },
  { key: "LOGO_URL", type: "string", fallbackValue: DEFAULT_LOGO_URL },
  { key: "PREVIEW_TEXT", type: "string", fallbackValue: "Your booking is confirmed" },
  { key: "HEADER_LINK_URL", type: "string", fallbackValue: `${APP_URL}/properties` },
  { key: "HEADER_LINK_LABEL", type: "string", fallbackValue: "View listings" },
  { key: "HERO_TITLE", type: "string", fallbackValue: "Booking confirmed" },
  { key: "HERO_SUBTITLE", type: "string", fallbackValue: "Your stay is confirmed." },
  { key: "STATUS_BADGE", type: "string", fallbackValue: "Confirmed" },
  { key: "STATUS_BADGE_BG", type: "string", fallbackValue: "#ecfdf5" },
  { key: "STATUS_BADGE_COLOR", type: "string", fallbackValue: "#059669" },
  { key: "PROPERTY_NAME", type: "string", fallbackValue: "Property" },
  { key: "PROPERTY_IMAGE_URL", type: "string", fallbackValue: `${DEFAULT_PRODUCTION_APP_URL}/properties/default.jpg` },
  { key: "PROPERTY_URL", type: "string", fallbackValue: APP_URL },
  { key: "PROPERTY_META", type: "string", fallbackValue: "" },
  { key: "STAY_LABEL", type: "string", fallbackValue: "—" },
  { key: "AMOUNT_LABEL", type: "string", fallbackValue: "—" },
  { key: "BOOKING_DETAILS_HTML", type: "string", fallbackValue: "" },
  { key: "CTA_URL", type: "string", fallbackValue: `${DEFAULT_PRODUCTION_APP_URL}/my-bookings` },
  { key: "CTA_LABEL", type: "string", fallbackValue: "View my bookings" },
  { key: "SECONDARY_CTA_URL", type: "string", fallbackValue: `${DEFAULT_PRODUCTION_APP_URL}/properties` },
  { key: "SECONDARY_CTA_LABEL", type: "string", fallbackValue: "Browse all listings" },
  { key: "SECONDARY_NOTE", type: "string", fallbackValue: "Questions? Reply to this email or visit your dashboard." },
];

export const GUEST_TEMPLATE_VARIABLES = [
  ...SHARED_VARIABLES,
  { key: "RECIPIENT_NAME", type: "string", fallbackValue: "there" },
];

export const HOST_TEMPLATE_VARIABLES = [
  ...SHARED_VARIABLES,
  { key: "RECIPIENT_NAME", type: "string", fallbackValue: "Host" },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const RAW_HTML_VARIABLES = new Set(["BOOKING_DETAILS_HTML"]);

export function renderTemplateHtml(html, variables) {
  let out = html;
  for (const [key, value] of Object.entries(variables)) {
    const replacement = RAW_HTML_VARIABLES.has(key)
      ? String(value ?? "")
      : escapeHtml(value ?? "");
    out = out.replaceAll(`{{{${key}}}}`, replacement);
  }
  return out;
}

/** @param {{ label: string; value: string }} row */
export function bookingDetailRowHtml({ label, value }) {
  return `
    <tr>
      <td style="padding:10px 0;font-size:14px;line-height:20px;color:#6b7280;width:120px;vertical-align:top;font-family:Arial,Helvetica,sans-serif;">${label}</td>
      <td style="padding:10px 0;font-size:14px;line-height:22px;color:#111827;vertical-align:top;font-family:Arial,Helvetica,sans-serif;">${value}</td>
    </tr>`;
}

function bookingEmailLayout() {
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${APP_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 24px !important; padding-right: 24px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-center { text-align: center !important; }
      .mobile-hide { display: none !important; }
      .hero-title { font-size: 28px !important; line-height: 1.2 !important; }
      .property-img { width: 100% !important; height: auto !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">{{{PREVIEW_TEXT}}}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:32px 40px 24px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left" class="mobile-center">
                    <a href="{{{APP_URL}}}" style="text-decoration:none;display:inline-block;">
                      <img src="{{{LOGO_URL}}}" alt="Kama Properties" width="180" height="40" border="0" style="display:block;width:180px;max-width:180px;height:auto;border:0;" />
                    </a>
                  </td>
                  <td align="right" class="mobile-hide" style="font-size:13px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">
                    <a href="{{{HEADER_LINK_URL}}}" style="color:#6b7280;text-decoration:underline;">{{{HEADER_LINK_LABEL}}}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;" class="mobile-padding">
              <h1 class="hero-title" style="margin:0;font-size:36px;font-weight:800;color:#111827;line-height:1.1;letter-spacing:-0.02em;font-family:Arial,Helvetica,sans-serif;">{{{HERO_TITLE}}}</h1>
              <p style="margin:12px 0 0;font-size:16px;color:#4b5563;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">{{{HERO_SUBTITLE}}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px;" class="mobile-padding">
              <a href="{{{PROPERTY_URL}}}" style="text-decoration:none;display:block;">
                <img src="{{{PROPERTY_IMAGE_URL}}}" alt="{{{PROPERTY_NAME}}}" width="520" height="320" class="property-img" style="display:block;width:100%;max-width:520px;height:auto;border-radius:12px;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:{{{STATUS_BADGE_BG}}};color:{{{STATUS_BADGE_COLOR}}};font-size:12px;font-weight:600;padding:4px 10px;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;font-family:Arial,Helvetica,sans-serif;">{{{STATUS_BADGE}}}</span>
                    <h2 style="margin:10px 0 6px;font-size:22px;font-weight:700;color:#111827;font-family:Arial,Helvetica,sans-serif;">{{{PROPERTY_NAME}}}</h2>
                    <p style="margin:0 0 8px;font-size:15px;color:#6b7280;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">{{{PROPERTY_META}}}</p>
                    <p style="margin:0 0 6px;font-size:15px;color:#374151;line-height:1.5;font-family:Arial,Helvetica,sans-serif;"><strong style="color:#111827;">{{{STAY_LABEL}}}</strong></p>
                    <p style="margin:0 0 20px;font-size:24px;font-weight:800;color:#111827;font-family:Arial,Helvetica,sans-serif;">{{{AMOUNT_LABEL}}}</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="border-radius:8px;background-color:#111827;" align="center">
                          <a href="{{{CTA_URL}}}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">{{{CTA_LABEL}}} &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #e5e7eb;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;" class="mobile-padding">
              <h3 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;font-family:Arial,Helvetica,sans-serif;">Booking details</h3>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                {{{BOOKING_DETAILS_HTML}}}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:12px;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="33%" align="center" valign="top" class="mobile-stack" style="padding-bottom:16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                            <tr>
                              <td align="center" style="width:40px;height:40px;background-color:#e0e7ff;border-radius:10px;font-size:18px;line-height:40px;font-family:Arial,Helvetica,sans-serif;">&#128269;</td>
                            </tr>
                          </table>
                          <p style="margin:10px 0 0;font-size:13px;font-weight:600;color:#374151;font-family:Arial,Helvetica,sans-serif;">Verified listings</p>
                        </td>
                        <td width="33%" align="center" valign="top" class="mobile-stack" style="padding-bottom:16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                            <tr>
                              <td align="center" style="width:40px;height:40px;background-color:#d1fae5;border-radius:10px;font-size:18px;line-height:40px;font-family:Arial,Helvetica,sans-serif;">&#9889;</td>
                            </tr>
                          </table>
                          <p style="margin:10px 0 0;font-size:13px;font-weight:600;color:#374151;font-family:Arial,Helvetica,sans-serif;">Instant booking</p>
                        </td>
                        <td width="33%" align="center" valign="top" class="mobile-stack">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                            <tr>
                              <td align="center" style="width:40px;height:40px;background-color:#fef3c7;border-radius:10px;font-size:18px;line-height:40px;font-family:Arial,Helvetica,sans-serif;">&#128737;</td>
                            </tr>
                          </table>
                          <p style="margin:10px 0 0;font-size:13px;font-weight:600;color:#374151;font-family:Arial,Helvetica,sans-serif;">Secure payments</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px;" class="mobile-padding" align="center">
              <p style="margin:0 0 16px;font-size:15px;color:#4b5563;font-family:Arial,Helvetica,sans-serif;">{{{SECONDARY_NOTE}}}</p>
              <a href="{{{SECONDARY_CTA_URL}}}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#111827;text-decoration:none;border:2px solid #e5e7eb;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">{{{SECONDARY_CTA_LABEL}}}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;background-color:#111827;border-radius:0 0 16px 16px;" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:Arial,Helvetica,sans-serif;">KAMA</span>
                    <span style="font-size:18px;font-weight:300;color:#ffffff;letter-spacing:-0.5px;font-family:Arial,Helvetica,sans-serif;"> Properties</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:13px;color:#9ca3af;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0 0 8px;">You received this email about a booking on ${APP_NAME}.</p>
                    <p style="margin:0;">
                      <a href="{{{APP_URL}}}" style="color:#9ca3af;text-decoration:underline;">www.isisel.com</a>
                    </p>
                    <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">&copy; 2026 ${APP_NAME}. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getGuestBookingTemplateHtml() {
  return bookingEmailLayout();
}

export function getHostBookingTemplateHtml() {
  return getGuestBookingTemplateHtml();
}

export function renderGuestBookingEmailHtml(variables) {
  return renderTemplateHtml(getGuestBookingTemplateHtml(), variables);
}

export function renderHostBookingEmailHtml(variables) {
  return renderTemplateHtml(getHostBookingTemplateHtml(), variables);
}

export function guestTemplateMeta() {
  return {
    name: "Kama — Booking confirmed (guest)",
    alias: GUEST_TEMPLATE_ALIAS,
    subject: "Booking confirmed — {{{PROPERTY_NAME}}}",
    html: getGuestBookingTemplateHtml(),
    variables: GUEST_TEMPLATE_VARIABLES,
  };
}

export function hostTemplateMeta() {
  return {
    name: "Kama — New reservation (host)",
    alias: HOST_TEMPLATE_ALIAS,
    subject: "New booking — {{{PROPERTY_NAME}}}",
    html: getHostBookingTemplateHtml(),
    variables: HOST_TEMPLATE_VARIABLES,
  };
}
