import User from "@/models/User";
import { TRAINING_GUEST } from "@/utils/opsTraining/constants";

export { TRAINING_GUEST, TRAINING_BOOKING_SOURCE } from "@/utils/opsTraining/constants";

/**
 * Idempotent training guest account so host calendars get a real profile photo.
 * Guest role only — cannot sign in with a password.
 */
export async function ensureTrainingGuestUser() {
  const email = TRAINING_GUEST.email;
  const existing = await User.findOne({
    email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  });

  if (existing) {
    let dirty = false;
    if (existing.username !== TRAINING_GUEST.username) {
      existing.username = TRAINING_GUEST.username;
      dirty = true;
    }
    if (existing.image !== TRAINING_GUEST.image) {
      existing.image = TRAINING_GUEST.image;
      dirty = true;
    }
    if (existing.role !== "guest") {
      existing.role = "guest";
      dirty = true;
    }
    if (existing.hostStatus !== "none") {
      existing.hostStatus = "none";
      dirty = true;
    }
    if (existing.isTrainingGuest !== true) {
      existing.isTrainingGuest = true;
      dirty = true;
    }
    if (dirty) await existing.save();
    return existing;
  }

  return User.create({
    email,
    username: TRAINING_GUEST.username,
    image: TRAINING_GUEST.image,
    role: "guest",
    hostStatus: "none",
    isTrainingGuest: true,
    preferences: {
      notifications: {
        bookingUpdates: false,
      },
    },
  });
}
