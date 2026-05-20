import mongoose from "mongoose";

const { Schema, models, model } = mongoose;

const CloudinaryMigrationLogSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "partial", "failed", "skipped"],
      default: "pending",
    },
    migratedAssets: [
      {
        type: { type: String },
        legacy: { type: String },
        publicId: { type: String },
        url: { type: String },
      },
    ],
    failedAssets: [
      {
        type: { type: String },
        legacy: { type: String },
        error: { type: String },
      },
    ],
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    error: { type: String },
  },
  {
    timestamps: true,
    collection: "CloudinaryMigrationLogs",
  },
);

const CloudinaryMigrationLog =
  models.CloudinaryMigrationLog ||
  model("CloudinaryMigrationLog", CloudinaryMigrationLogSchema);

export default CloudinaryMigrationLog;
