import { Schema, models, model } from "mongoose";

const CategoriesSchema = new Schema(
  {
    quality: { type: Number, min: 1, max: 5 },
    reliability: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 },
  },
  { _id: false },
);

const CleaningReviewSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "CleaningJob",
      required: true,
      index: true,
    },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cleanerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fromRole: {
      type: String,
      enum: ["host", "cleaner"],
      required: true,
    },
    categories: { type: CategoriesSchema, default: () => ({}) },
    overall: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true },
);

CleaningReviewSchema.index(
  { jobId: 1, fromRole: 1 },
  { unique: true },
);

const CleaningReview =
  models.CleaningReview || model("CleaningReview", CleaningReviewSchema);
export default CleaningReview;
