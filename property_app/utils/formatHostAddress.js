/**
 * Host application `address` may be a plain string (legacy form) or a
 * Places-style object { formatted, streetLine1, city, ... }.
 * Never pass the raw value into JSX — that causes React error #31.
 *
 * @param {unknown} address
 * @returns {string}
 */
export function formatHostAddress(address) {
  if (address == null || address === "") return "";
  if (typeof address === "string") return address.trim();
  if (typeof address !== "object") return String(address);

  if (typeof address.formatted === "string" && address.formatted.trim()) {
    return address.formatted.trim();
  }

  const parts = [
    address.streetLine1,
    address.streetLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean);

  return parts.join(", ");
}
