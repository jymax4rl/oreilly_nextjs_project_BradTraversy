import { requireOpsDocumentationApi } from "@/utils/documentation/requireOpsDocumentationApi";
import { ensureDocumentationSeeded } from "@/utils/documentation/seed";

/** Force re-seed of system-owned articles (ops-edited articles are skipped). */
export async function POST() {
  const gate = await requireOpsDocumentationApi();
  if (gate.error) return gate.error;

  try {
    const result = await ensureDocumentationSeeded();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message || "Seed failed" },
      { status: 500 },
    );
  }
}
