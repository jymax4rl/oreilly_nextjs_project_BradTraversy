import { Schema, models, model } from "mongoose";
import { AUDIT_ACTIONS } from "@/utils/foundingHost/logic";

const ActorSchema = new Schema(
  {
    id: { type: String, default: null },
    email: { type: String, default: null },
    name: { type: String, default: null },
  },
  { _id: false },
);

const AuditLogSchema = new Schema(
  {
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: true,
      index: true,
    },
    previousStatus: { type: String, default: null },
    newStatus: { type: String, default: null },
    previousExpiration: { type: Date, default: null },
    newExpiration: { type: Date, default: null },
    actor: { type: ActorSchema, default: undefined },
    reason: { type: String, default: null, maxlength: 1000 },
    notes: { type: String, default: null, maxlength: 4000 },
    meta: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true, collection: "AuditLogs" },
);

AuditLogSchema.index({ host: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = models.AuditLog || model("AuditLog", AuditLogSchema);

export default AuditLog;
