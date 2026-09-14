import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { canBrowseListingCatalog } from "@/utils/listings/catalogBeta";
import { searchMapProperties } from "@/utils/listings/mapSearch";
import {
  guestCatalogCorsPreflight,
  withGuestCatalogCors,
} from "@/utils/listings/guestCatalogCors";
import { getAuthFromRequest } from "@/utils/getAuthFromRequest";

/**
 * GET /api/properties/map
 * Lean viewport search for price markers. Requires catalog browse access.
 */
export async function OPTIONS(request) {
  return guestCatalogCorsPreflight(request);
}

export async function GET(request) {
  try {
    // Prefer Bearer (Expo) when present; fall back to NextAuth cookie session.
    const session =
      (await getAuthFromRequest(request)) ||
      (await getServerSession(authOptions));
    if (!canBrowseListingCatalog(session)) {
      return withGuestCatalogCors(request, NextResponse.json(
        { ok: false, error: "Catalog not available" },
        { status: 403 },
      ));
    }

    const ok = await connectToDatabase();
    if (!ok) {
      return withGuestCatalogCors(request, NextResponse.json(
        { ok: false, error: "Database unavailable" },
        { status: 503 },
      ));
    }

    const result = await searchMapProperties(request.nextUrl.searchParams);
    if (!result.ok) {
      return withGuestCatalogCors(request, NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status || 400 },
      ));
    }

    return withGuestCatalogCors(request, NextResponse.json({
      ok: true,
      pins: result.pins,
      count: result.count,
      truncated: result.truncated,
      bounds: result.bounds,
      checkIn: result.checkIn,
      checkOut: result.checkOut,
    }));
  } catch (error) {
    console.error("[properties/map]", error);
    return withGuestCatalogCors(request, NextResponse.json(
      { ok: false, error: "Unable to load map stays" },
      { status: 500 },
    ));
  }
}
