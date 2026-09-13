import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { canBrowseListingCatalog } from "@/utils/listings/catalogBeta";
import { canUserViewListing } from "@/utils/listingApproval";
import { propertyImageUrls } from "@/utils/propertyImageUrl";
import { propertyPublicPath } from "@/utils/listings/propertyPath";

function isObjectIdLike(id) {
  return /^[a-f\d]{24}$/i.test(String(id || ""));
}

/**
 * GET /api/properties/[id]/preview
 * Lean public payload for homepage Flip preview modal.
 */
export async function GET(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!canBrowseListingCatalog(session)) {
      return NextResponse.json(
        { ok: false, error: "Catalog not available" },
        { status: 403 },
      );
    }

    const ok = await connectToDatabase();
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Database unavailable" },
        { status: 503 },
      );
    }

    const { id } = await params;
    const key = String(id || "").trim();
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "Missing property id" },
        { status: 400 },
      );
    }

    const property = isObjectIdLike(key)
      ? await Property.findById(key).lean()
      : await Property.findOne({ slug: key.toLowerCase() }).lean();

    if (!property || !canUserViewListing(property, session)) {
      return NextResponse.json(
        { ok: false, error: "Stay not found" },
        { status: 404 },
      );
    }

    const images = propertyImageUrls(property.images).slice(0, 12);
    const href = propertyPublicPath(property);

    return NextResponse.json({
      ok: true,
      property: {
        id: String(property._id),
        slug: property.slug || null,
        name: property.name || "Stay",
        type: property.type || "",
        description: String(property.description || "").slice(0, 420),
        beds: property.beds ?? null,
        baths: property.baths ?? null,
        squareFeet: property.square_feet ?? null,
        maxGuests: property.listing?.maxGuests ?? null,
        amenities: Array.isArray(property.amenities)
          ? property.amenities.filter(Boolean).slice(0, 16)
          : [],
        city: property.location?.city || "",
        country: property.location?.country || "",
        listingPrice: property.listingPrice ?? property.rates?.nightly ?? null,
        rates: property.rates || null,
        images,
        href,
      },
    });
  } catch (error) {
    console.error("[properties/preview]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load preview" },
      { status: 500 },
    );
  }
}
