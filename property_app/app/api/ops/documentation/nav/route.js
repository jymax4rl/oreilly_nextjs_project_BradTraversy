import { requireOpsDocumentationApi } from "@/utils/documentation/requireOpsDocumentationApi";
import { getDocumentationNav } from "@/utils/documentation/service";
import { ensureDocumentationSeeded } from "@/utils/documentation/seed";
import { CATEGORY_ORDER } from "@/utils/documentation/seedArticles";

export async function GET() {
  const gate = await requireOpsDocumentationApi();
  if (gate.error) return gate.error;

  try {
    await ensureDocumentationSeeded();
    const nav = await getDocumentationNav();
    const order = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
    nav.sort(
      (a, b) =>
        (order.get(a.category) ?? 999) - (order.get(b.category) ?? 999),
    );
    return Response.json({ ok: true, nav, categoryOrder: CATEGORY_ORDER });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message || "Failed to load nav" },
      { status: 500 },
    );
  }
}
