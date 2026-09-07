import { Schema, models, model } from "mongoose";
import { CLEANING_STATUSES, CLEANING_TYPES, ISSUE_TYPES } from "@/utils/cleaners/constants";

const ChecklistStateSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false },
);

const MediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    resourceType: { type: String, default: "image" },
    duration: { type: Number, default: null },
    mimeType: { type: String, default: "" },
    fileSize: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true },
);

const IssueSchema = new Schema(
  {
    type: { type: String, enum: ISSUE_TYPES, default: "other" },
    note: { type: String, default: "" },
    photos: { type: [MediaSchema], default: [] },
    audio: { type: [MediaSchema], default: [] },
    status: {
      type: String,
      enum: ["reported", "acknowledged", "resolved"],
      default: "reported",
    },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true },
);

const CleaningJobSchema = new Schema(
  {
    hostId: { type: String, required: true, index: true },
    cleanerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    requestedCleanerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },
    propertyName: { type: String, default: "" },
    propertyAddress: { type: String, default: "" },
    checkoutTime: { type: String, default: "" },
    scheduledDate: { type: String, required: true, index: true },
    scheduledStartTime: { type: String, default: "" },
    scheduledEndTime: { type: String, default: "" },
    estimatedDuration: { type: Number, default: 150 },
    status: {
      type: String,
      enum: CLEANING_STATUSES,
      default: "pending",
      index: true,
    },
    cleaningType: {
      type: String,
      enum: CLEANING_TYPES,
      default: "checkout",
    },
    checklist: { type: [ChecklistStateSchema], default: [] },
    propertyInstructions: { type: String, default: "" },
    hostNotes: { type: String, default: "" },
    cleanerNotes: { type: String, default: "" },
    photos: { type: [MediaSchema], default: [] },
    audioReports: { type: [MediaSchema], default: [] },
    issueReports: { type: [IssueSchema], default: [] },
    startedAt: { type: Date, default: null },
    completionTimestamp: { type: Date, default: null },
    agreedPrice: { type: Number, default: null },
    currency: { type: String, default: "GMD" },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "waived"],
      default: "unpaid",
    },
    paymentMethod: { type: String, default: "" },
    paymentReference: { type: String, default: "" },
  },
  { timestamps: true },
);

CleaningJobSchema.index({ hostId: 1, scheduledDate: 1, status: 1 });
CleaningJobSchema.index(
  { reservationId: 1, cleaningType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reservationId: { $type: "objectId" },
      cleaningType: "checkout",
    },
  },
);

const CleaningJob =
  models.CleaningJob || model("CleaningJob", CleaningJobSchema);
export default CleaningJob;
