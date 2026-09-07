import Link from "next/link";

export default function CleanerSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-[var(--kama-ink-muted)]">
        Availability and specialties live on your profile. Notifications will expand to email, SMS, and WhatsApp later.
      </p>
      <Link href="/cleaners/profile" className="inline-flex text-sm font-semibold text-[var(--kama-accent)]">
        Edit profile & availability
      </Link>
    </div>
  );
}
