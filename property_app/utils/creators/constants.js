export const CREATOR_SOURCE = "influencers";

export const CREATOR_PLATFORMS = [
  "youtube",
  "tiktok",
  "instagram",
  "multiple",
  "other",
];

export const CREATOR_STAGE_IDS = [
  "new",
  "contacted",
  "discussing",
  "proposed",
  "negotiating",
  "active",
  "completed",
  "not_fit",
];

export const CREATOR_STAGES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "discussing", label: "Discussing" },
  { id: "proposed", label: "Partnership Proposed" },
  { id: "negotiating", label: "Negotiating" },
  { id: "active", label: "Active Partnership" },
  { id: "completed", label: "Completed" },
  { id: "not_fit", label: "Not a Fit" },
];

export const CREATOR_FUNNEL_EVENTS = [
  "page_visit",
  "cta_click",
  "form_opened",
  "form_started",
  "form_completed",
  "platform_selected",
  "lead_submitted",
];

export function creatorStageLabel(id) {
  return CREATOR_STAGES.find((s) => s.id === id)?.label || id;
}

export function creatorPlatformLabel(id) {
  const map = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    multiple: "Multiple",
    other: "Other",
  };
  return map[id] || "";
}
