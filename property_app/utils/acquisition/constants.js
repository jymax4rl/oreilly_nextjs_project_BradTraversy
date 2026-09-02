export const ACQUISITION_STAGES = [
  { id: "new", label: "New", short: "New" },
  { id: "researching", label: "Researching", short: "Research" },
  { id: "ready", label: "Ready to Contact", short: "Ready" },
  { id: "contacted", label: "Contacted", short: "Contacted" },
  { id: "follow_up", label: "Follow-up", short: "Follow-up" },
  { id: "interested", label: "Interested", short: "Interested" },
  { id: "negotiating", label: "Negotiating", short: "Negotiate" },
  { id: "onboarding", label: "Onboarding", short: "Onboard" },
  { id: "converted", label: "Converted", short: "Won" },
  { id: "lost", label: "Lost", short: "Lost" },
];

export const STAGE_IDS = ACQUISITION_STAGES.map((s) => s.id);

export const ACQUISITION_SOURCES = [
  { id: "airbnb", label: "Airbnb" },
  { id: "booking", label: "Booking.com" },
  { id: "google", label: "Google" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "referral", label: "Referral" },
  { id: "website", label: "Website" },
  { id: "directory", label: "Directories" },
  { id: "other", label: "Other" },
];

export const SOURCE_IDS = ACQUISITION_SOURCES.map((s) => s.id);

export const ACQUISITION_PRIORITIES = [
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

export const PRIORITY_IDS = ACQUISITION_PRIORITIES.map((p) => p.id);

export const CONTACT_METHODS = [
  { id: "phone", label: "Phone" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "in_person", label: "In person" },
  { id: "other", label: "Other" },
];

export const CONTACT_METHOD_IDS = CONTACT_METHODS.map((m) => m.id);

export const CONTACT_STATUSES = [
  { id: "not_contacted", label: "Not contacted" },
  { id: "attempted", label: "Attempted" },
  { id: "reached", label: "Reached" },
  { id: "awaiting_reply", label: "Waiting for reply" },
  { id: "in_conversation", label: "In conversation" },
];

export const CONTACT_STATUS_IDS = CONTACT_STATUSES.map((s) => s.id);

export const PROPERTY_TYPES = [
  "Villa",
  "Apartment",
  "House",
  "Riads / guesthouse",
  "Boutique hotel",
  "Rooms",
  "Unique stay",
];

export const EXISTING_PLATFORMS = [
  "Airbnb",
  "Booking.com",
  "Expedia",
  "Direct / website",
  "WhatsApp only",
  "None",
];

export const ACTIVITY_TYPES = [
  { id: "call", label: "Phone Call" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "instagram_dm", label: "Instagram DM" },
  { id: "tiktok_dm", label: "TikTok DM" },
  { id: "in_person", label: "In-person" },
  { id: "website_visit", label: "Website visit" },
  { id: "follow_up", label: "Follow-up" },
  { id: "meeting", label: "Meeting" },
  { id: "note", label: "Note" },
  { id: "owner_replied", label: "Owner replied" },
  { id: "owner_interested", label: "Owner interested" },
  { id: "owner_declined", label: "Owner declined" },
  { id: "demo", label: "Demo presented" },
  { id: "host_registered", label: "Host registered" },
  { id: "property_created", label: "Property created" },
  { id: "converted", label: "Host converted" },
  { id: "stage_change", label: "Stage changed" },
  { id: "priority_change", label: "Priority changed" },
  { id: "other", label: "Other" },
];

export const ACTIVITY_TYPE_IDS = ACTIVITY_TYPES.map((t) => t.id);

export const PAIN_POINTS = [
  { id: "commission", label: "High commissions" },
  { id: "bookings", label: "Lack of bookings" },
  { id: "dependence", label: "Dependence on one platform" },
  { id: "management", label: "Difficult property management" },
  { id: "mobile", label: "Poor mobile management" },
  { id: "direct", label: "Lack of direct bookings" },
  { id: "visibility", label: "Wanting more visibility" },
  { id: "none", label: "Nothing currently problematic" },
];

export const PAIN_POINT_IDS = PAIN_POINTS.map((p) => p.id);

export const CALL_RESULTS = [
  { id: "converted", label: "Converted", stage: "onboarding" },
  { id: "interested", label: "Interested", stage: "interested" },
  { id: "follow_up", label: "Follow-up", stage: "follow_up" },
  { id: "asked_info", label: "Asked for information", stage: "contacted" },
  { id: "not_interested", label: "Not interested", stage: "lost" },
  { id: "no_answer", label: "No answer", stage: "contacted" },
  { id: "wrong_person", label: "Wrong person", stage: "researching" },
];

export const CALL_RESULT_IDS = CALL_RESULTS.map((r) => r.id);

export const COPILOT_STEPS = [
  { id: "open", n: 1, label: "Open" },
  { id: "discover", n: 2, label: "Discover" },
  { id: "pain", n: 3, label: "Identify pain" },
  { id: "pitch", n: 4, label: "Position Isisel" },
  { id: "response", n: 5, label: "Handle response" },
  { id: "close", n: 6, label: "Close" },
  { id: "next", n: 7, label: "Next action" },
];

export function painLabel(id) {
  return PAIN_POINTS.find((p) => p.id === id)?.label || id || "—";
}

export const FOLLOW_UP_BUCKETS = ["today", "upcoming", "overdue", "completed"];

export const KPI_DEFS = [
  { id: "total", label: "Total Prospects" },
  { id: "new", label: "New Prospects" },
  { id: "to_contact", label: "To Contact" },
  { id: "contacted", label: "Contacted" },
  { id: "follow_up_due", label: "Follow-up Due" },
  { id: "interested", label: "Interested" },
  { id: "onboarding", label: "Onboarding" },
  { id: "converted", label: "Converted Hosts" },
  { id: "lost", label: "Lost" },
  { id: "conversion_rate", label: "Conversion Rate" },
];

export function stageLabel(id) {
  return ACQUISITION_STAGES.find((s) => s.id === id)?.label || id || "—";
}

export function sourceLabel(id) {
  return ACQUISITION_SOURCES.find((s) => s.id === id)?.label || id || "—";
}

export function priorityLabel(id) {
  return ACQUISITION_PRIORITIES.find((p) => p.id === id)?.label || id || "—";
}

export function activityLabel(id) {
  return ACTIVITY_TYPES.find((t) => t.id === id)?.label || id || "Activity";
}

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export function whatsappHref(phoneOrWa) {
  const digits = digitsOnly(phoneOrWa);
  return digits ? `https://wa.me/${digits}` : null;
}

export function telHref(phone) {
  const digits = digitsOnly(phone);
  return digits ? `tel:+${digits.replace(/^0+/, "")}` : phone ? `tel:${phone}` : null;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const URL_RE = /^https?:\/\/.+/i;
