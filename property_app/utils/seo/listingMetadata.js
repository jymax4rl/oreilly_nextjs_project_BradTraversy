function placeLabel(property) {
  const city = String(property?.location?.city || "").trim();
  const country = String(property?.location?.country || "").trim();
  if (city && country) return `${city}, ${country}`;
  return city || country || "Africa";
}

function typeLabel(property) {
  const type = String(property?.type || "").trim();
  return type || "Vacation";
}

/**
 * Title segment for the root layout template (`%s | Isisel`).
 * Example: "Nile View Retreat - Villa Rental in Cairo, Egypt"
 */
export function listingTitleSegment(property) {
  const name = String(property?.name || "Stay").trim() || "Stay";
  return `${name} - ${typeLabel(property)} Rental in ${placeLabel(property)}`;
}

export function listingMetaDescription(property) {
  const name = String(property?.name || "this stay").trim() || "this stay";
  const place = placeLabel(property);
  const features = [];
  const beds = Number(property?.beds);
  const baths = Number(property?.baths);
  const sqft = Number(property?.square_feet);
  if (Number.isFinite(beds) && beds > 0) {
    features.push(`${beds} bed${beds === 1 ? "" : "s"}`);
  }
  if (Number.isFinite(baths) && baths > 0) {
    features.push(`${baths} bath${baths === 1 ? "" : "s"}`);
  }
  if (Number.isFinite(sqft) && sqft >= 50 && sqft <= 200_000) {
    features.push(`${Math.round(sqft).toLocaleString()} sq ft`);
  }

  let featureClause = "";
  if (features.length === 1) {
    featureClause = ` Features ${features[0]}.`;
  } else if (features.length === 2) {
    featureClause = ` Features ${features[0]} and ${features[1]}.`;
  } else if (features.length >= 3) {
    featureClause = ` Features ${features.slice(0, -1).join(", ")}, and ${features.at(-1)}.`;
  }

  return `Book ${name} in ${place}.${featureClause} Secure your African vacation rental today.`;
}

export function listingKeywords(property) {
  return [
    typeLabel(property),
    property?.location?.city,
    property?.location?.country,
    "vacation rental",
    "Africa",
    "Isisel",
  ]
    .filter(Boolean)
    .join(", ");
}
