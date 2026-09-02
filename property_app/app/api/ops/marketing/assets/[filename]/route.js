import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";
import { MARKETING_PDFS } from "@/utils/marketing/templates";

const ALLOWED = new Set(Object.values(MARKETING_PDFS).map((p) => p.filename));

function pdfCandidates(filename) {
  const cwd = process.cwd();
  return [
    join(cwd, "public", "marketing", filename),
    join(cwd, "docs", filename),
    join(cwd, "property_app", "public", "marketing", filename),
    join(cwd, "property_app", "docs", filename),
  ];
}

/**
 * GET /api/ops/marketing/assets/:filename
 * Staff-only PDF download for compose preview.
 */
export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOpsStaff(session.user.role)) {
    return new Response("Unauthorized", { status: 403 });
  }

  const filename = String((await params).filename || "").trim();
  if (!ALLOWED.has(filename)) {
    return new Response("Not found", { status: 404 });
  }

  for (const path of pdfCandidates(filename)) {
    if (!existsSync(path)) continue;
    const buf = await readFile(path);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  }

  return new Response("PDF not generated on this server", { status: 404 });
}
