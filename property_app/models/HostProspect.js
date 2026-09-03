import { Schema, models, model } from "mongoose";
import {
  STAGE_IDS,
  SOURCE_IDS,
  PRIORITY_IDS,
  CONTACT_METHOD_IDS,
  CONTACT_STATUS_IDS,
} from "@/utils/acquisition/constants";

const ActorSchema = new Schema(
  {
    id: { type: String, default: null },
    email: { type: String, default: null },
    name: { type: String, default: null },
  },
  { _id: false },
);

const HostProspectSchema = new Schema(
  {
    businessName: { type: String, required: true, trim: true, maxlength: 160 },
    contactName: { type: String, default: "", trim: true, maxlength: 120 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    email: { type: String, default: "", trim: true, lowercase: true, maxlength: 254 },
    whatsapp: { type: String, default: "", trim: true, maxlength: 40 },
    website: { type: String, default: "", trim: true, maxlength: 300 },
    country: { type: String, default: "", trim: true, maxlength: 80 },
    city: { type: String, default: "", trim: true, maxlength: 80 },
    address: { type: String, default: "", trim: true, maxlength: 240 },

    propertyCount: { type: Number, default: 1, min: 0, max: 5000 },
    propertyTypes: { type: [String], default: [] },
    estimatedListings: { type: Number, default: null, min: 0, max: 5000 },
    existingPlatforms: { type: [String], default: [] },
    estimatedBookingVolume: { type: String, default: "", trim: true, maxlength: 80 },
    estimatedMonthlyRevenue: { type: String, default: "", trim: true, maxlength: 80 },
    propertyNotes: { type: String, default: "", trim: true, maxlength: 4000 },

    source: {
      type: String,
      enum: SOURCE_IDS,
      default: "other",
      index: true,
    },
    sourceUrl: { type: String, default: "", trim: true, maxlength: 500 },
    discoveryMethod: { type: String, default: "", trim: true, maxlength: 400 },
    assignedTo: { type: ActorSchema, default: undefined },
    priority: {
      type: String,
      enum: PRIORITY_IDS,
      default: "medium",
      index: true,
    },

    stage: {
      type: String,
      enum: STAGE_IDS,
      default: "new",
      index: true,
    },

    preferredContactMethod: {
      type: String,
      enum: CONTACT_METHOD_IDS,
      default: "whatsapp",
    },
    bestTimeToContact: { type: String, default: "", trim: true, maxlength: 80 },
    contactStatus: {
      type: String,
      enum: CONTACT_STATUS_IDS,
      default: "not_contacted",
    },
    awaitingReply: { type: Boolean, default: false },

    lastContactAt: { type: Date, default: null, index: true },
    nextFollowUpAt: { type: Date, default: null, index: true },
    followUpReason: { type: String, default: "", trim: true, maxlength: 240 },
    followUpReminder: { type: Boolean, default: true },
    followUpNotes: { type: String, default: "", trim: true, maxlength: 2000 },
    followUpStatus: {
      type: String,
      enum: ["open", "completed", "cancelled"],
      default: "open",
    },

    notes: { type: String, default: "", trim: true, maxlength: 8000 },

    painPoint: { type: String, default: "", trim: true, maxlength: 80 },
    lookingForBookings: {
      type: String,
      enum: ["yes", "maybe", "no"],
      default: undefined,
    },
    callResult: { type: String, default: "", trim: true, maxlength: 40 },
    copilotMemory: { type: Schema.Types.Mixed, default: {} },

    archived: { type: Boolean, default: false, index: true },

    convertedUser: { type: Schema.Types.ObjectId, ref: "User", default: null },
    convertedAt: { type: Date, default: null },
    convertedPropertyCount: { type: Number, default: null },

    createdBy: { type: ActorSchema, default: undefined },
  },
  { timestamps: true },
);

HostProspectSchema.index({ archived: 1, stage: 1, nextFollowUpAt: 1 });
HostProspectSchema.index({ archived: 1, source: 1, stage: 1 });
HostProspectSchema.index({ email: 1 });
HostProspectSchema.index({ phone: 1 });
HostProspectSchema.index({ createdAt: -1 });
HostProspectSchema.index({ "assignedTo.id": 1, archived: 1 });

const HostProspect =
  models.HostProspect || model("HostProspect", HostProspectSchema);

export default HostProspect;
