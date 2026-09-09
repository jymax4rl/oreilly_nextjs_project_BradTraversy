"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CATEGORY_ORDER } from "@/utils/documentation/seedArticles";

function listToText(value) {
  return Array.isArray(value) ? value.join("\n") : String(value || "");
}

export default function DocumentationEditor({ initial = null, mode = "create" }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: initial?.title || "",
    slug: initial?.slug || "",
    category: initial?.category || CATEGORY_ORDER[0],
    subcategory: initial?.subcategory || "",
    summary: initial?.summary || "",
    content: initial?.content || "",
    tags: listToText(initial?.tags),
    status: initial?.status || "draft",
    featureStatus: initial?.featureStatus || "active",
    version: initial?.version || "1.1.0",
    relatedRoutes: listToText(initial?.relatedRoutes),
    relatedFiles: listToText(initial?.relatedFiles),
    relatedModels: listToText(initial?.relatedModels),
    relatedApiEndpoints: listToText(initial?.relatedApiEndpoints),
    relatedFeatures: listToText(initial?.relatedFeatures),
    relatedSlugs: listToText(initial?.relatedSlugs),
    markReviewed: true,
  });

  const categories = useMemo(() => {
    const set = new Set(CATEGORY_ORDER);
    if (form.category) set.add(form.category);
    return [...set];
  }, [form.category]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (nextStatus) => {
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      status: nextStatus || form.status,
    };
    try {
      const res = await fetch(
        mode === "edit"
          ? `/api/ops/documentation/${initial.id}`
          : "/api/ops/documentation",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Save failed");
      router.push(`/documentation/${data.article.slug}`);
      router.refresh();
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="docs-editor max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <label htmlFor="docs-title">Title</label>
      <input
        id="docs-title"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        required
      />

      <label htmlFor="docs-slug">Slug</label>
      <input
        id="docs-slug"
        value={form.slug}
        onChange={(e) => setField("slug", e.target.value)}
        placeholder="auto-from-title-if-empty-on-create"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="docs-category">Category</label>
          <select
            id="docs-category"
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="docs-subcategory">Subcategory</label>
          <input
            id="docs-subcategory"
            value={form.subcategory}
            onChange={(e) => setField("subcategory", e.target.value)}
          />
        </div>
      </div>

      <label htmlFor="docs-summary">Summary</label>
      <textarea
        id="docs-summary"
        value={form.summary}
        onChange={(e) => setField("summary", e.target.value)}
        required
        style={{ minHeight: "5rem" }}
      />

      <label htmlFor="docs-content">Content (Markdown)</label>
      <textarea
        id="docs-content"
        value={form.content}
        onChange={(e) => setField("content", e.target.value)}
        required
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="docs-status">Status</label>
          <select
            id="docs-status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="outdated">outdated</option>
            <option value="deprecated">deprecated</option>
            <option value="archived">archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="docs-feature">Feature status</label>
          <select
            id="docs-feature"
            value={form.featureStatus}
            onChange={(e) => setField("featureStatus", e.target.value)}
          >
            <option value="active">active</option>
            <option value="partial">partial</option>
            <option value="inactive">inactive</option>
            <option value="planned">planned</option>
            <option value="deprecated">deprecated</option>
          </select>
        </div>
        <div>
          <label htmlFor="docs-version">Version</label>
          <input
            id="docs-version"
            value={form.version}
            onChange={(e) => setField("version", e.target.value)}
          />
        </div>
      </div>

      <label htmlFor="docs-tags">Tags (comma or newline)</label>
      <textarea
        id="docs-tags"
        value={form.tags}
        onChange={(e) => setField("tags", e.target.value)}
        style={{ minHeight: "4rem" }}
      />

      {[
        ["relatedRoutes", "Related routes"],
        ["relatedFiles", "Related files"],
        ["relatedModels", "Related models"],
        ["relatedApiEndpoints", "Related API endpoints"],
        ["relatedFeatures", "Related features"],
        ["relatedSlugs", "Related doc slugs"],
      ].map(([key, label]) => (
        <div key={key}>
          <label htmlFor={`docs-${key}`}>{label}</label>
          <textarea
            id={`docs-${key}`}
            value={form[key]}
            onChange={(e) => setField(key, e.target.value)}
            style={{ minHeight: "4rem" }}
          />
        </div>
      ))}

      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.markReviewed}
          onChange={(e) => setField("markReviewed", e.target.checked)}
        />
        Mark reviewed now
      </label>

      {error ? (
        <p className="mb-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="docs-actions">
        <button
          type="submit"
          className="docs-btn docs-btn--primary"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className="docs-btn"
          disabled={saving}
          onClick={() => void save("draft")}
        >
          Save draft
        </button>
        <button
          type="button"
          className="docs-btn"
          disabled={saving}
          onClick={() => void save("active")}
        >
          Publish
        </button>
        <button
          type="button"
          className="docs-btn"
          disabled={saving}
          onClick={() => void save("outdated")}
        >
          Mark outdated
        </button>
        <button
          type="button"
          className="docs-btn"
          disabled={saving}
          onClick={() => router.push("/documentation/manage")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
