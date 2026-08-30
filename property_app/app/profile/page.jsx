import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { getProfilePayload } from "@/utils/user/getProfilePayload";
import ProfileDisplayNameForm from "@/components/profile/ProfileDisplayNameForm";
import ProfileAvatarUpload from "@/components/profile/ProfileAvatarUpload";
import ProfileSections from "@/components/profile/ProfileSections";
import { ArrowLeft, Shield, UserRound } from "lucide-react";

export const metadata = {
  title: "Profile | Kama Properties",
  description: "Your Kama Properties account, bookings, and hosting status",
};

function RoleBadge({ children, accent = false }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
        accent
          ? "bg-[var(--kama-accent)] text-white"
          : "bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]"
      }`}
    >
      {children}
    </span>
  );
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--kama-canvas)] px-4 pb-[calc(var(--kama-chrome-clearance,4.25rem)+2rem)] pt-24">
        <div className="max-w-md text-center">
          <UserRound
            className="mx-auto mb-4 h-14 w-14 text-[var(--kama-ink-muted)] opacity-40"
            aria-hidden
          />
          <h1 className="text-2xl font-bold text-[var(--kama-ink)]">
            Sign in required
          </h1>
          <p className="mt-2 text-[var(--kama-ink-muted)]">
            Sign in to view and manage your profile.
          </p>
          <Link
            href="/login?callbackUrl=%2Fprofile"
            className="kama-cta mt-6 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--kama-accent-hover)]"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  await connectToDatabase();
  const profile = await getProfilePayload(session.user);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--kama-canvas)] px-4 pt-24">
        <p className="text-[var(--kama-ink-muted)]">Profile not found.</p>
      </div>
    );
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  const imageSrc = profile.image || session.user.image || null;

  return (
    <div className="relative min-h-screen bg-[var(--kama-canvas)] px-4 pb-[calc(var(--kama-chrome-clearance,4.25rem)+3rem)] pt-24 sm:px-6 lg:px-8">
      {/* Soft ocean wash behind identity header */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--kama-accent-glow),_transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl">
        <Link
          href="/properties"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--kama-ink-muted)] hover:text-[var(--kama-accent)]"
        >
          <ArrowLeft size={16} aria-hidden />
          Browse properties
        </Link>

        <header className="overflow-hidden rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-[0_12px_40px_rgba(12,26,26,0.06)]">
          <div className="h-2 bg-[linear-gradient(90deg,var(--kama-accent),#2a7a73)]" />
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-7">
            <ProfileAvatarUpload
              initialImage={imageSrc}
              initialName={profile.name || session.user.name || "U"}
            />

            <div className="min-w-0 flex-1">
              <ProfileDisplayNameForm initialName={profile.name} />
              <p className="mt-1 truncate text-sm text-[var(--kama-ink-muted)]">
                {profile.email}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {profile.roles.admin && (
                  <RoleBadge accent>
                    <Shield size={11} className="mr-1 inline" aria-hidden />
                    Admin
                  </RoleBadge>
                )}
                {profile.roles.host && <RoleBadge>Host</RoleBadge>}
                <RoleBadge>Guest</RoleBadge>
              </div>

              {memberSince && (
                <p className="mt-3 text-xs text-[var(--kama-ink-muted)]">
                  Member since {memberSince}
                </p>
              )}

              <Link
                href="/settings"
                className="mt-4 inline-flex text-sm font-medium text-[var(--kama-accent)] hover:underline"
              >
                Account settings
              </Link>
            </div>
          </div>
        </header>

        <ProfileSections profile={profile} />
      </div>
    </div>
  );
}
