"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import BrandLogo from "@/components/BrandLogo";

const NAV = [
  { href: "/ops", label: "Home", exact: true },
  { href: "/ops/hosts", label: "Hosts" },
  { href: "/ops/listings", label: "Listings" },
  { href: "/ops/transactions", label: "Transactions" },
];

function navActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function OpsNav() {
  const pathname = usePathname() || "";
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--kama-border)] bg-[var(--kama-surface)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo href="/ops" className="h-8 w-auto" />
          <span className="hidden h-4 w-px bg-[var(--kama-border-strong)] sm:block" />
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)] sm:inline">
            Operations
          </span>
        </div>

        <nav
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
          aria-label="Ops console"
        >
          {NAV.map((item) => {
            const active = navActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]"
                    : "text-[var(--kama-ink-muted)] hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden max-w-[180px] truncate text-xs text-[var(--kama-ink-muted)] md:inline">
            {session?.user?.email}
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/ops/login" })}
            className="rounded-md border border-[var(--kama-border)] px-3 py-1.5 text-xs font-semibold text-[var(--kama-ink-muted)] transition hover:border-[var(--kama-border-strong)] hover:text-[var(--kama-ink)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
