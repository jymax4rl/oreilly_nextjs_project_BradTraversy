export const CLEANING_STATUSES = Object.freeze([
  "pending",
  "requested",
  "accepted",
  "declined",
  "scheduled",
  "en_route",
  "in_progress",
  "completed",
  "issue_reported",
  "cancelled",
]);

export const CLEANING_TYPES = Object.freeze([
  "checkout",
  "regular",
  "deep",
  "emergency",
  "custom",
]);

export const CLEANER_SPECIALTIES = Object.freeze([
  "apartments",
  "villas",
  "hotels",
  "offices",
  "deep_cleaning",
  "laundry",
  "linen_change",
  "post_checkout",
]);

export const ISSUE_TYPES = Object.freeze([
  "damage",
  "maintenance",
  "missing_item",
  "cleaning_problem",
  "access_problem",
  "safety",
  "other",
]);

export const DEFAULT_CHECKLIST = Object.freeze([
  { key: "linen", label: "Change bed linen" },
  { key: "towels", label: "Replace towels" },
  { key: "bathroom", label: "Clean bathroom" },
  { key: "kitchen", label: "Clean kitchen" },
  { key: "bedrooms", label: "Clean bedrooms" },
  { key: "vacuum", label: "Vacuum floors" },
  { key: "mop", label: "Mop floors" },
  { key: "bins", label: "Empty bins" },
  { key: "toiletries", label: "Restock toiletries" },
  { key: "damage", label: "Check property for damage" },
]);

export const WEEKDAYS = Object.freeze([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const MAX_AUDIO_SECONDS = 180;
export const MAX_CLEANING_PHOTOS = 12;
export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function defaultWeekAvailability() {
  return WEEKDAYS.reduce((acc, day) => {
    acc[day] = {
      available: day !== "sunday",
      start: "08:00",
      end: "18:00",
    };
    return acc;
  }, {});
}

export function cloneChecklist(items = DEFAULT_CHECKLIST) {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    done: false,
  }));
}
