import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { getSettingsPayload } from "@/utils/user/getSettingsPayload";
import SettingsSections from "@/components/settings/SettingsSections";
import { ArrowLeft, Settings as SettingsIcon, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings | Isisel",
  description: "Account preferences, notifications, and hosting options",
  robots: { index: false, follow: false },
};

function RoleChip({ children, accent = false }) {
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

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--kama-canvas)] px-4 pb-[calc(var(--kama-chrome-clearance,4.25rem)+2rem)] pt-24">
        <div className="max-w-md text-center">
          <SettingsIcon
            className="mx-auto mb-4 h-14 w-14 text-[var(--kama-ink-muted)] opacity-40"
            aria-hidden
          />
          <h1 className="text-2xl font-bold text-[var(--kama-ink)]">
            Sign in required
          </h1>
          <p className="mt-2 text-[var(--kama-ink-muted)]">
            Sign in to manage your account settings.
          </p>
          <Link
            href="/login?callbackUrl=%2Fsettings"
            className="kama-cta mt-6 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--kama-accent-hover)]"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  await connectToDatabase();
  const settings = await getSettingsPayload(session.user);

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--kama-canvas)] px-4 pt-24">
        <p className="text-[var(--kama-ink-muted)]">Account not found.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--kama-canvas)] px-4 pb-[calc(var(--kama-chrome-clearance,4.25rem)+3rem)] pt-24 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,_var(--kama-accent-glow),_transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-2xl">
        <Link
          href="/profile"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--kama-ink-muted)] hover:text-[var(--kama-accent)]"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to Profile
        </Link>

        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--kama-ink)]">
            Settings
          </h1>
          <p className="mt-2 text-[var(--kama-ink-muted)]">
            Preferences for your account — not your public profile.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {settings.roles.admin && (
              <RoleChip accent>
                <Shield size={11} className="mr-1 inline" aria-hidden />
                Admin
              </RoleChip>
            )}
            {settings.roles.host && <RoleChip>Host</RoleChip>}
            <RoleChip>Guest</RoleChip>
          </div>
        </header>

        <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 shadow-[0_12px_40px_rgba(12,26,26,0.05)] sm:px-7">
          <SettingsSections settings={settings} />
        </div>
      </div>
    </div>
  );
}
