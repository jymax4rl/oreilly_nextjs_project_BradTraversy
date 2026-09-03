export const INVESTOR_SOURCE = "investors";

export const INVESTOR_STAGE_IDS = [
  "new",
  "reviewing",
  "discussing",
  "term_sheet",
  "closed",
  "declined",
];

export const INVESTOR_STAGES = [
  { id: "new", label: "New" },
  { id: "reviewing", label: "Reviewing" },
  { id: "discussing", label: "Discussing" },
  { id: "term_sheet", label: "Term sheet" },
  { id: "closed", label: "Closed" },
  { id: "declined", label: "Declined" },
];

export function investorStageLabel(id) {
  return INVESTOR_STAGES.find((s) => s.id === id)?.label || id;
}
