/**
 * Coerce values to a safe React text child.
 * Prevents React error #31 (objects are not valid as a React child).
 * @param {unknown} value
 * @param {string} [fallback=""]
 * @returns {string}
 */
export function toReactText(value, fallback = "") {
  if (value == null || value === "") return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "bigint") return value.toString();
  // Never render plain objects / arrays / Dates as children
  return fallback;
}
