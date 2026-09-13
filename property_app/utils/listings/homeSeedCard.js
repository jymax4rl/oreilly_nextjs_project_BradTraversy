/**
 * Shrink a serialized catalog property to the card/map seed shape.
 * Coordinates are optional on cold-open cards; map search still requires them.
 */
export function toHomeSeedCard(property) {
  if (!property) return null;
  const id = property._id?.toString?.() ?? property._id ?? property.id;
  if (!id) return null;
  const location = property.location || {};
  const latNum = Number(location.lat);
  const lngNum = Number(location.lng);
  const lat = Number.isFinite(latNum) ? latNum : null;
  const lng = Number.isFinite(lngNum) ? lngNum : null;

  const nightly =
    property.listingPrice != null && Number.isFinite(Number(property.listingPrice))
      ? Number(property.listingPrice)
      : property.rates?.nightly != null &&
          Number.isFinite(Number(property.rates.nightly))
        ? Number(property.rates.nightly)
        : null;

  return {
    _id: String(id),
    id: String(id),
    slug: property.slug || null,
    name: property.name || null,
    type: property.type || null,
    beds: property.beds ?? null,
    baths: property.baths ?? null,
    square_feet: property.square_feet ?? null,
    listingPrice: nightly,
    rates: {
      nightly,
      weekly: property.rates?.weekly ?? null,
      monthly: property.rates?.monthly ?? null,
    },
    images: Array.isArray(property.images) ? property.images : [],
    location: {
      city: location.city || null,
      state: location.state || null,
      country: location.country || null,
      lat,
      lng,
    },
    is_featured: Boolean(property.is_featured),
    previewLocked: Boolean(property.previewLocked),
  };
}
