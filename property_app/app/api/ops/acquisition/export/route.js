import HostProspect from "@/models/HostProspect";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { prospectMatchQuery, serializeProspect } from "@/utils/acquisition/prospects";

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * GET /api/ops/acquisition/export
 */
export async function GET(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const { searchParams } = new URL(request.url);
    const query = prospectMatchQuery({
      q: searchParams.get("q"),
      stage: searchParams.get("stage"),
      source: searchParams.get("source"),
      priority: searchParams.get("priority"),
      city: searchParams.get("city"),
      assignedTo: searchParams.get("assignedTo"),
      kpi: searchParams.get("kpi"),
      followup: searchParams.get("followup"),
      archived: searchParams.get("archived"),
    });

    const docs = await HostProspect.find(query).sort({ createdAt: -1 }).limit(2000).lean();
    const rows = docs.map(serializeProspect);
    const headers = [
      "businessName",
      "contactName",
      "phone",
      "email",
      "whatsapp",
      "website",
      "country",
      "city",
      "address",
      "propertyCount",
      "source",
      "priority",
      "stage",
      "lastContactAt",
      "nextFollowUpAt",
      "notes",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((key) => csvEscape(row[key] ?? "")).join(","),
      ),
    ];

    return new Response(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="isisel-host-prospects.csv"`,
      },
    });
  } catch (error) {
    console.error("acquisition export GET:", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}
