import { Schema, models, model } from "mongoose";
import {
  CLEANER_SPECIALTIES,
  CLEANING_TYPES,
  WEEKDAYS,
} from "@/utils/cleaners/constants";

const DaySchema = new Schema(
  {
    available: { type: Boolean, default: true },
    start: { type: String, default: "08:00" },
    end: { type: String, default: "18:00" },
  },
  { _id: false },
);

const availabilityShape = WEEKDAYS.reduce((acc, day) => {
  acc[day] = { type: DaySchema, default: () => ({}) };
  return acc;
}, {});

const CleanerProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 2000 },
    location: { type: String, default: "" },
    languages: { type: [String], default: [] },
    yearsExperience: { type: Number, default: 0, min: 0, max: 60 },
    specialties: {
      type: [String],
      enum: CLEANER_SPECIALTIES,
      default: [],
    },
    photoUrl: { type: String, default: "" },
    availability: availabilityShape,
    unavailableDates: { type: [String], default: [] },
    maxDailyJobs: { type: Number, default: 4, min: 1, max: 20 },
    minNoticeHours: { type: Number, default: 12, min: 0, max: 168 },
    preferredRadiusKm: { type: Number, default: 25, min: 1, max: 500 },
    availableTypes: {
      type: [String],
      enum: CLEANING_TYPES,
      default: () => ["checkout", "regular"],
    },
    discoverable: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    completedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const CleanerProfile =
  models.CleanerProfile || model("CleanerProfile", CleanerProfileSchema);
export default CleanerProfile;
