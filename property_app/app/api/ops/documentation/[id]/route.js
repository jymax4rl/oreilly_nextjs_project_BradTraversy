import {
  requireOpsDocumentationApi,
  documentationActor,
} from "@/utils/documentation/requireOpsDocumentationApi";
import {
  getDocumentationById,
  getDocumentationBySlug,
  updateDocumentation,
  archiveDocumentation,
} from "@/utils/documentation/service";

export async function GET(_request, { params }) {
  const gate = await requireOpsDocumentationApi();
  if (gate.error) return gate.error;

  try {
    const { id } = await params;
    const byId = await getDocumentationById(id);
    if (byId) return Response.json({ ok: true, article: byId });
    const bySlug = await getDocumentationBySlug(id, { includeDrafts: true });
    if (!bySlug) {
      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return Response.json({ ok: true, article: bySlug });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message || "Failed to load article" },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  const gate = await requireOpsDocumentationApi();
  if (gate.error) return gate.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const article = await updateDocumentation(
      id,
      body,
      documentationActor(gate.session),
    );
    return Response.json({ ok: true, article });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message || "Failed to update article" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request, { params }) {
  const gate = await requireOpsDocumentationApi();
  if (gate.error) return gate.error;

  try {
    const { id } = await params;
    const article = await archiveDocumentation(
      id,
      documentationActor(gate.session),
    );
    return Response.json({ ok: true, article });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message || "Failed to archive article" },
      { status: 400 },
    );
  }
}
