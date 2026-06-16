/**
 * Cinematic welcome at /onboarding — for verified hosts only (not guest applicants).
 */
export function needsHostWelcome(user) {
  if (!user) return false;
  return (
    user.hostStatus === "verified" && user.hasCompletedHostOnboarding !== true
  );
}

export function canAccessHostWelcome(user) {
  if (!user) return false;
  return user.hostStatus === "verified";
}
