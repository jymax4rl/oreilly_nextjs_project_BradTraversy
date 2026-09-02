"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Home,
  Users,
  Building2,
  LayoutList,
  CreditCard,
  Megaphone,
  Menu,
  X,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const NAV = [
  { href: "/ops", label: "Home", exact: true, Icon: Home },
  { href: "/ops/users", label: "Users", Icon: Users },
  { href: "/ops/hosts", label: "Hosts", Icon: Building2 },
  { href: "/ops/listings", label: "Listings", Icon: LayoutList },
  { href: "/ops/transactions", label: "Transactions", Icon: CreditCard },
];

const MARKETING = {
  href: "/ops/marketing",
  label: "Marketing",
  Icon: Megaphone,
};

function navActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function OpsNav() {
  const pathname = usePathname() || "";
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const marketingActive = navActive(pathname, MARKETING);

  const inner = (
    <>
      <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-4">
        <div className="rounded-lg bg-white px-2 py-1.5">
          <BrandLogo href="/ops" className="h-7 w-auto" />
        </div>
        <button
          type="button"
          className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="px-4 pb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
        Operations
      </p>

      <nav className="flex flex-1 flex-col gap-6 px-3" aria-label="Ops console">
        <div>
          <p className="ops-side-label">Console</p>
          <ul className="mt-1.5 space-y-0.5">
            {NAV.map((item) => {
              const active = navActive(pathname, item);
              const Icon = item.Icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`ops-side-link ${active ? "ops-side-link--active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="ops-side-label">Outreach</p>
          <Link
            href={MARKETING.href}
            onClick={() => setOpen(false)}
            className={`ops-side-link ops-side-link--marketing ${
              marketingActive ? "ops-side-link--marketing-active" : ""
            }`}
            aria-current={marketingActive ? "page" : undefined}
          >
            <Megaphone className="h-4 w-4 shrink-0" />
            {MARKETING.label}
          </Link>
        </div>
      </nav>

      <div className="mt-auto border-t border-white/10 px-4 py-4">
        <p className="truncate text-[11px] text-white/50">
          {session?.user?.email}
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/ops/login" })}
          className="mt-3 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--kama-border)] bg-[#0c1a1a] px-4 lg:hidden">
        <div className="rounded-md bg-white px-2 py-1">
          <BrandLogo href="/ops" className="h-6 w-auto" />
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-white"
          onClick={() => setOpen(true)}
          aria-label="Open operations menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`ops-sidebar ${open ? "ops-sidebar--open" : ""}`}
      >
        {inner}
      </aside>
    </>
  );
}
