import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import CleanerShell from "@/components/cleaners/CleanerShell";
import Link from "next/link";

export const metadata = {
  title: {
    default: "Cleaners",
    template: "%s · Isisel Cleaners",
  },
  robots: { index: false, follow: false },
};

export default async function CleanersLayout({ children }) {
  const session = await getServerSession(authOptions);
  return (
    <CleanerShell name={session?.user?.name}>
      {children}
    </CleanerShell>
  );
}

export function CleanerNeedInvite() {
  return (
    <div className="rounded-3xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-6">
      <h1 className="text-2xl font-semibold">Cleaner access</h1>
      <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
        You need an invitation from a host to use the cleaner console.
      </p>
      <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-[var(--kama-accent)]">
        Back to Isisel
      </Link>
    </div>
  );
}
