import HostProspect from "@/models/HostProspect";
import { requireOpsApi, opsActor } from "@/utils/ops/requireOpsApi";
import { sanitizeProspectInput } from "@/utils/acquisition/prospects";
import { SOURCE_IDS, STAGE_IDS, PRIORITY_IDS } from "@/utils/acquisition/constants";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const src = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    const next = src[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim()));
}

function headerKey(name) {
  const raw = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  const map = {
    business: "businessName",
    businessname: "businessName",
    property: "businessName",
    propertyname: "businessName",
    owner: "contactName",
    contact: "contactName",
    contactname: "contactName",
    phone: "phone",
    email: "email",
    whatsapp: "whatsapp",
    website: "website",
    country: "country",
    city: "city",
    address: "address",
    propertycount: "propertyCount",
    numberofproperties: "propertyCount",
    source: "source",
    sourceurl: "sourceUrl",
    priority: "priority",
    stage: "stage",
    notes: "notes",
  };
  return map[raw] || null;
}

/**
 * POST /api/ops/acquisition/import
 * { csv, dryRun? }
 */
export async function POST(request) {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const body = await request.json().catch(() => ({}));
    const rows = parseCsv(body.csv);
    if (rows.length < 2) {
      return Response.json({ error: "CSV needs a header row and at least one prospect" }, { status: 400 });
    }

    const headers = rows[0].map(headerKey);
    if (!headers.includes("businessName")) {
      return Response.json(
        { error: "CSV must include a Business / Property Name column" },
        { status: 400 },
      );
    }

    const errors = [];
    const prepared = [];
    rows.slice(1).forEach((cells, index) => {
      const raw = {};
      headers.forEach((key, i) => {
        if (key) raw[key] = cells[i];
      });
      if (raw.source && !SOURCE_IDS.includes(String(raw.source).toLowerCase())) {
        const lowered = String(raw.source).toLowerCase();
        if (lowered.includes("booking")) raw.source = "booking";
        else if (lowered.includes("airbnb")) raw.source = "airbnb";
        else if (lowered.includes("google")) raw.source = "google";
        else if (lowered.includes("tiktok")) raw.source = "tiktok";
        else if (lowered.includes("instagram")) raw.source = "instagram";
        else if (lowered.includes("facebook")) raw.source = "facebook";
        else if (lowered.includes("refer")) raw.source = "referral";
        else raw.source = "other";
      }
      if (raw.stage && !STAGE_IDS.includes(raw.stage)) raw.stage = "new";
      if (raw.priority && !PRIORITY_IDS.includes(String(raw.priority).toLowerCase())) {
        raw.priority = "medium";
      } else if (raw.priority) {
        raw.priority = String(raw.priority).toLowerCase();
      }
      const data = sanitizeProspectInput(raw, { partial: false });
      const line = index + 2;
      if (!data.businessName) {
        errors.push({ line, error: "Missing business / property name" });
        return;
      }
      data.createdBy = opsActor(gate.session);
      prepared.push({ line, data });
    });

    if (body.dryRun) {
      return Response.json({
        ok: errors.length === 0,
        ready: prepared.length,
        errors,
      });
    }

    if (errors.length) {
      return Response.json({ error: "Fix CSV errors before importing", errors }, { status: 400 });
    }

    const inserted = await HostProspect.insertMany(
      prepared.map((row) => row.data),
      { ordered: false },
    );

    return Response.json({ ok: true, imported: inserted.length, errors: [] });
  } catch (error) {
    console.error("acquisition import POST:", error);
    return Response.json({ error: "Import failed" }, { status: 500 });
  }
}
