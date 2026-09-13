import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { canBrowseListingCatalog } from "@/utils/listings/catalogBeta";
import { suggestCatalogSearch } from "@/utils/listings/suggestSearch";

/**
 * GET /api/properties/suggest?q=&lang=
 * Availability-based search propositions (city / country / stay name).
 * Returns nothing unless matching public listings exist.
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!canBrowseListingCatalog(session)) {
      return NextResponse.json(
        { ok: false, error: "Catalog not available" },
        { status: 403 },
      );
    }

    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q") || "";
    const lang = searchParams.get("lang") || "en";

    if (String(q).trim().length < 2) {
      return NextResponse.json({ ok: true, suggestions: [] });
    }

    const ok = await connectToDatabase();
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Database unavailable" },
        { status: 503 },
      );
    }

    const result = await suggestCatalogSearch(q, { lang, limit: 8 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[properties/suggest]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load suggestions" },
      { status: 500 },
    );
  }
}
