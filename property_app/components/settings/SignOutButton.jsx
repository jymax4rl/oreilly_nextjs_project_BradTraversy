"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--kama-ink)] transition hover:border-[var(--kama-border-strong)] hover:bg-[var(--kama-field)]"
    >
      <LogOut size={16} aria-hidden />
      Sign out
    </button>
  );
}
