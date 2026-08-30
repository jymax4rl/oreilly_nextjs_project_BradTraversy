/**
 * One-line property summary for email cards (beds · baths · type · location).
 */
export function formatPropertyMeta(property, locationLabel) {
  const parts = [];
  if (property?.beds != null) {
    parts.push(`${property.beds} bed${property.beds !== 1 ? "s" : ""}`);
  }
  if (property?.baths != null) {
    parts.push(`${property.baths} bath${property.baths !== 1 ? "s" : ""}`);
  }
  if (property?.type) {
    parts.push(property.type);
  }
  if (locationLabel) {
    parts.push(locationLabel);
  }
  return parts.join(" · ");
}
