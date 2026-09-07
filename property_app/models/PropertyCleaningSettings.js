import { Schema, models, model } from "mongoose";
import { CLEANING_TYPES, DEFAULT_CHECKLIST } from "@/utils/cleaners/constants";

const ChecklistItemSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

const PropertyCleaningSettingsSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      unique: true,
      index: true,
    },
    hostId: {
      type: String,
      required: true,
      index: true,
    },
    autoCreateOnCheckout: { type: Boolean, default: true },
    defaultType: {
      type: String,
      enum: CLEANING_TYPES,
      default: "checkout",
    },
    estimatedMinutes: { type: Number, default: 150, min: 30, max: 720 },
    instructions: { type: String, default: "", maxlength: 4000 },
    checklist: {
      type: [ChecklistItemSchema],
      default: () => DEFAULT_CHECKLIST.map((item) => ({ ...item })),
    },
  },
  { timestamps: true },
);

const PropertyCleaningSettings =
  models.PropertyCleaningSettings ||
  model("PropertyCleaningSettings", PropertyCleaningSettingsSchema);
export default PropertyCleaningSettings;
