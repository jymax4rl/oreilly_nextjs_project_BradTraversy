import Documentation, {
  buildDocumentationSearchText,
} from "@/models/Documentation";

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeDoc(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(o._id),
    title: o.title,
    slug: o.slug,
    category: o.category,
    subcategory: o.subcategory || "",
    summary: o.summary,
    content: o.content,
    tags: o.tags || [],
    status: o.status,
    featureStatus: o.featureStatus || "active",
    version: o.version || "",
    author: o.author || null,
    lastReviewedAt: o.lastReviewedAt
      ? new Date(o.lastReviewedAt).toISOString()
      : null,
    relatedFeatures: o.relatedFeatures || [],
    relatedRoutes: o.relatedRoutes || [],
    relatedFiles: o.relatedFiles || [],
    relatedModels: o.relatedModels || [],
    relatedApiEndpoints: o.relatedApiEndpoints || [],
    relatedSlugs: o.relatedSlugs || [],
    visibility: o.visibility || "ops",
    seedKey: o.seedKey || null,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
    updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : null,
  };
}

export function serializeDocumentation(doc) {
  return serializeDoc(doc);
}

export async function listDocumentation({
  q = "",
  category = "",
  status = "active",
  limit = 50,
  includeDrafts = false,
} = {}) {
  const filter = { visibility: "ops" };

  if (status === "all") {
    if (!includeDrafts) {
      filter.status = { $nin: ["archived"] };
    }
  } else if (status) {
    filter.status = status;
  } else if (!includeDrafts) {
    filter.status = "active";
  }

  if (category) filter.category = category;

  const query = String(q || "").trim();
  if (query) {
    const rx = new RegExp(escapeRegex(query), "i");
    filter.$or = [
      { title: rx },
      { summary: rx },
      { content: rx },
      { category: rx },
      { subcategory: rx },
      { tags: rx },
      { relatedFeatures: rx },
      { relatedRoutes: rx },
      { relatedFiles: rx },
      { relatedModels: rx },
      { relatedApiEndpoints: rx },
      { searchText: rx },
    ];
  }

  const docs = await Documentation.find(filter)
    .sort(query ? { updatedAt: -1 } : { category: 1, title: 1 })
    .limit(Math.min(Number(limit) || 50, 200))
    .lean();

  return docs.map(serializeDoc);
}

export async function getDocumentationBySlug(slug, { includeDrafts = false } = {}) {
  const filter = {
    slug: String(slug || "")
      .trim()
      .toLowerCase(),
    visibility: "ops",
  };
  if (!includeDrafts) {
    filter.status = { $in: ["active", "outdated", "deprecated"] };
  }
  const doc = await Documentation.findOne(filter).lean();
  return serializeDoc(doc);
}

export async function getDocumentationById(id) {
  const doc = await Documentation.findById(id).lean();
  return serializeDoc(doc);
}

export async function getDocumentationNav({ includeDrafts = false } = {}) {
  const filter = { visibility: "ops" };
  filter.status = includeDrafts
    ? { $nin: ["archived"] }
    : { $in: ["active", "outdated", "deprecated"] };

  const docs = await Documentation.find(filter)
    .select("title slug category subcategory status featureStatus updatedAt")
    .sort({ category: 1, title: 1 })
    .lean();

  const byCategory = new Map();
  for (const d of docs) {
    const cat = d.category || "Other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push({
      title: d.title,
      slug: d.slug,
      subcategory: d.subcategory || "",
      status: d.status,
      featureStatus: d.featureStatus,
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    });
  }
  return [...byCategory.entries()].map(([category, articles]) => ({
    category,
    articles,
  }));
}

export async function getDocumentationHome() {
  const [active, recentlyUpdated, recentlyAdded, troubleshooting] =
    await Promise.all([
      Documentation.find({ visibility: "ops", status: "active" })
        .select("title slug category summary tags status featureStatus updatedAt")
        .sort({ category: 1, title: 1 })
        .lean(),
      Documentation.find({
        visibility: "ops",
        status: { $in: ["active", "outdated"] },
      })
        .select("title slug category summary status updatedAt")
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean(),
      Documentation.find({ visibility: "ops", status: "active" })
        .select("title slug category summary status createdAt")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Documentation.find({
        visibility: "ops",
        status: "active",
        category: "Troubleshooting",
      })
        .select("title slug summary updatedAt")
        .sort({ title: 1 })
        .lean(),
    ]);

  const categories = [...new Set(active.map((d) => d.category))];

  return {
    categories: categories.map((category) => ({
      category,
      count: active.filter((d) => d.category === category).length,
    })),
    recentlyUpdated: recentlyUpdated.map(serializeDoc),
    recentlyAdded: recentlyAdded.map(serializeDoc),
    troubleshooting: troubleshooting.map(serializeDoc),
    important: active
      .filter((d) =>
        [
          "platform-overview",
          "ops-access",
          "booking-lifecycle",
          "payments-integrations",
          "ops-console",
          "known-limitations",
        ].includes(d.slug),
      )
      .map(serializeDoc),
    overview: active
      .filter((d) =>
        ["platform-overview", "application-architecture", "current-platform-status"].includes(
          d.slug,
        ),
      )
      .map(serializeDoc),
  };
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function slugifyTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export async function createDocumentation(input, actor) {
  const title = String(input.title || "").trim();
  if (!title) throw new Error("Title is required");
  const slug = String(input.slug || slugifyTitle(title))
    .trim()
    .toLowerCase();
  const payload = {
    title,
    slug,
    category: String(input.category || "Platform Overview").trim(),
    subcategory: String(input.subcategory || "").trim(),
    summary: String(input.summary || "").trim(),
    content: String(input.content || "").trim(),
    tags: normalizeStringList(input.tags),
    status: input.status || "draft",
    featureStatus: input.featureStatus || "active",
    version: input.version || "1.1.0",
    author: actor,
    lastReviewedAt: input.markReviewed ? new Date() : undefined,
    relatedFeatures: normalizeStringList(input.relatedFeatures),
    relatedRoutes: normalizeStringList(input.relatedRoutes),
    relatedFiles: normalizeStringList(input.relatedFiles),
    relatedModels: normalizeStringList(input.relatedModels),
    relatedApiEndpoints: normalizeStringList(input.relatedApiEndpoints),
    relatedSlugs: normalizeStringList(input.relatedSlugs),
    visibility: "ops",
  };
  if (!payload.summary) throw new Error("Summary is required");
  if (!payload.content) throw new Error("Content is required");
  payload.searchText = buildDocumentationSearchText(payload);

  const created = await Documentation.create(payload);
  return serializeDoc(created);
}

export async function updateDocumentation(id, input, actor) {
  const doc = await Documentation.findById(id);
  if (!doc) throw new Error("Documentation not found");

  const fields = [
    "title",
    "slug",
    "category",
    "subcategory",
    "summary",
    "content",
    "status",
    "featureStatus",
    "version",
  ];
  for (const key of fields) {
    if (input[key] != null) doc[key] = String(input[key]).trim();
  }

  const listFields = [
    "tags",
    "relatedFeatures",
    "relatedRoutes",
    "relatedFiles",
    "relatedModels",
    "relatedApiEndpoints",
    "relatedSlugs",
  ];
  for (const key of listFields) {
    if (input[key] != null) doc[key] = normalizeStringList(input[key]);
  }

  if (input.markReviewed) {
    doc.lastReviewedAt = new Date();
  }
  doc.author = actor || doc.author;
  doc.searchText = buildDocumentationSearchText(doc);
  await doc.save();
  return serializeDoc(doc);
}

export async function archiveDocumentation(id, actor) {
  return updateDocumentation(id, { status: "archived" }, actor);
}
