import { Schema, models, model } from "mongoose";
import { AddressSchema } from "./AddressSchema";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: [true, "Email already exists"],
      required: [true, "Email is required"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    image: {
      type: String,
    },
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Property",
      },
    ],
    //role and host status
    role: {
      type: String,
      enum: ["guest", "host", "admin", "superadmin"],
      default: "guest",
    },
    /**
     * bcrypt hash for ops Credentials sign-in only.
     * Guests/hosts keep Google OAuth; this field stays unset for them.
     */
    passwordHash: {
      type: String,
      select: false,
      default: undefined,
    },
    hostStatus: {
      type: String,
      enum: ["none", "onboarding", "verified", "rejected"],
      default: "none",
    },
    /**
     * Ops-only account block. Banned users fail sign-in (Google + ops Credentials).
     * Existing JWTs still expire naturally; ban is re-checked on token hydrate.
     */
    banned: {
      type: Boolean,
      default: false,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    bannedReason: {
      type: String,
      default: null,
    },
    bannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    /** Ops training guest used to seed host calendars. Excluded from analytics. */
    isTrainingGuest: {
      type: Boolean,
      default: false,
      index: true,
    },
    /**
     * Web Push subscriptions (installed PWA / mobile Chrome).
     * Used to alert hosts on new reservations, including lock screen.
     */
    pushSubscriptions: {
      type: [
        {
          _id: false,
          endpoint: { type: String, required: true },
          expirationTime: { type: Number, default: null },
          keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true },
          },
          updatedAt: { type: Date, default: Date.now },
        },
      ],
      default: undefined,
    },
    /**
     * Unread reservation alerts for the installed PWA icon badge.
     * Incremented on each host push; cleared when they open the host console.
     */
    hostPushBadge: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Host-application pitch seen (modal on /host/onboarding). */
    hasCompletedHostOnboarding: {
      type: Boolean,
      default: false,
    },
    /** Verified host mailing address (synced from host application). */
    hostAddress: AddressSchema,
    /**
     * Account preferences (Settings). Missing keys mean “default on”.
     * Booking email senders honor these unless a force-resend bypasses them.
     */
    preferences: {
      notifications: {
        /** Guest: confirmation / modify / cancel emails for your trips */
        bookingUpdates: { type: Boolean, default: true },
        /** Host: new booking confirmation emails */
        hostNewBookings: { type: Boolean, default: true },
        /** Host: guest date changes and cancellations */
        hostBookingChanges: { type: Boolean, default: true },
      },
    },
    /** Last accepted Terms & Conditions version string (e.g. kama-terms-v1.0-…). */
    termsVersion: {
      type: String,
      default: null,
    },
    /** When the user accepted the current (or last recorded) terms version. */
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    /**
     * Founding 100 Host program. Eligibility is attached to the host, not listings.
     * `isFoundingHost` stays true after the commission-free window expires (badge).
     * `status: revoked` hides the badge; `number` is never reused.
     */
    foundingHost: {
      isFoundingHost: { type: Boolean, default: false },
      number: { type: Number },
      grantedAt: { type: Date },
      expiresAt: { type: Date },
      grantedBy: { type: Schema.Types.Mixed },
      grantReason: { type: String, maxlength: 1000 },
      status: {
        type: String,
        enum: ["active", "revoked"],
      },
    },
    /**
     * Ops-granted commission override. Independent of Founding 100 allocation.
     */
    commissionOverride: {
      enabled: { type: Boolean, default: false },
      rate: { type: Number, min: 0, max: 1 },
      startsAt: { type: Date },
      expiresAt: { type: Date },
      reason: { type: String, maxlength: 1000 },
      notes: { type: String, maxlength: 4000 },
      grantedBy: { type: Schema.Types.ObjectId, ref: "User" },
      grantedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ createdAt: 1 });
UserSchema.index({ hostStatus: 1, createdAt: 1 });

UserSchema.index(
  { "foundingHost.number": 1 },
  { unique: true, sparse: true },
);
UserSchema.index({ "foundingHost.isFoundingHost": 1, "foundingHost.status": 1 });

const User = models.User || model("User", UserSchema);
export default User;
