import {
  requireOpsDocumentationApi,
  documentationActor,
} from "@/utils/documentation/requireOpsDocumentationApi";
import {
  listDocumentation,
  createDocumentation,
  getDocumentationHome,
} from "@/utils/documentation/service";
import { ensureDocumentationSeeded } from "@/utils/documentation/seed";

export async function GET(request) {
  const gate = await requireOpsDocumentationApi();
  if (gate.error) return gate.error;

  try {
    await ensureDocumentationSeeded();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "home") {
      const home = await getDocumentationHome();
      return Response.json({ ok: true, ...home });
    }

    const docs = await listDocumentation({
      q: searchParams.get("q") || "",
      category: searchParams.get("category") || "",
      status: searchParams.get("status") || "active",
      limit: Number(searchParams.get("limit") || 50),
      includeDrafts: searchParams.get("manage") === "1",
    });
    return Response.json({ ok: true, articles: docs });
  } catch (err) {
    console.error("[documentation] GET failed:", err);
    return Response.json(
      { ok: false, error: err.message || "Failed to load documentation" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const gate = await requireOpsDocumentationApi();
  if (gate.error) return gate.error;

  try {
    const body = await request.json();
    const article = await createDocumentation(
      body,
      documentationActor(gate.session),
    );
    return Response.json({ ok: true, article }, { status: 201 });
  } catch (err) {
    console.error("[documentation] POST failed:", err);
    return Response.json(
      { ok: false, error: err.message || "Failed to create documentation" },
      { status: 400 },
    );
  }
}
