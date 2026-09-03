/**
 * Host-application pitch (modal on /host/onboarding).
 * Public landing — visitors, guests, and hosts can open it anytime.
 */

export const HOST_PITCH_LS_KEY = "isisel_host_pitch_v1";

/** Pitch opens on every visit to /host/onboarding. */
export function shouldShowHostPitch() {
  return true;
}

/** @deprecated Verified hosts are no longer gated through /onboarding. */
export function needsHostWelcome() {
  return false;
}

export function canAccessHostWelcome() {
  return false;
}
