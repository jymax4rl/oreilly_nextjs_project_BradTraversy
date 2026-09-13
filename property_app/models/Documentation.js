import { Schema, models, model } from "mongoose";

const DOCUMENTATION_STATUSES = [
  "active",
  "draft",
  "outdated",
  "deprecated",
  "archived",
];

const DocumentationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    subcategory: { type: String, trim: true, maxlength: 80, default: "" },
    summary: { type: String, required: true, trim: true, maxlength: 600 },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: DOCUMENTATION_STATUSES,
      default: "active",
      index: true,
    },
    /** Honest feature readiness for the topic this article describes. */
    featureStatus: {
      type: String,
      enum: ["active", "partial", "inactive", "planned", "deprecated"],
      default: "active",
    },
    version: { type: String, default: "1.1.0" },
    author: {
      id: { type: String },
      email: { type: String },
      name: { type: String },
    },
    lastReviewedAt: { type: Date },
    relatedFeatures: { type: [String], default: [] },
    relatedRoutes: { type: [String], default: [] },
    relatedFiles: { type: [String], default: [] },
    relatedModels: { type: [String], default: [] },
    relatedApiEndpoints: { type: [String], default: [] },
    relatedSlugs: { type: [String], default: [] },
    visibility: {
      type: String,
      enum: ["ops"],
      default: "ops",
      index: true,
    },
    /** Seed batch id so we can re-seed without wiping ops edits. */
    seedKey: { type: String, index: true, sparse: true },
    searchText: { type: String, default: "" },
  },
  { timestamps: true },
);

DocumentationSchema.index({
  title: "text",
  summary: "text",
  content: "text",
  category: "text",
  subcategory: "text",
  tags: "text",
  relatedFeatures: "text",
  relatedRoutes: "text",
  relatedFiles: "text",
  relatedModels: "text",
  relatedApiEndpoints: "text",
  searchText: "text",
});

DocumentationSchema.index({ category: 1, status: 1, updatedAt: -1 });
DocumentationSchema.index({ status: 1, updatedAt: -1 });

export function buildDocumentationSearchText(doc) {
  return [
    doc.title,
    doc.summary,
    doc.category,
    doc.subcategory,
    doc.content,
    ...(doc.tags || []),
    ...(doc.relatedFeatures || []),
    ...(doc.relatedRoutes || []),
    ...(doc.relatedFiles || []),
    ...(doc.relatedModels || []),
    ...(doc.relatedApiEndpoints || []),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 50000);
}

DocumentationSchema.pre("validate", function buildSearch() {
  this.searchText = buildDocumentationSearchText(this);
});

const Documentation =
  models.Documentation || model("Documentation", DocumentationSchema);

export default Documentation;
export { DOCUMENTATION_STATUSES };
