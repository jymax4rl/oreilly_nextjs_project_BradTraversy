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
    /** Cinematic pre-listing welcome flow at /onboarding (hosts only). */
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
  },
  {
    timestamps: true,
  }
);

const User = models.User || model("User", UserSchema);
export default User;
