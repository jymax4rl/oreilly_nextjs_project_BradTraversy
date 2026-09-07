"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/host/cleaning", label: "Today", exact: true },
  { href: "/host/cleaning/jobs/new", label: "Ask" },
  { href: "/host/cleaning/cleaners", label: "People" },
  { href: "/host/cleaning/jobs", label: "All" },
  { href: "/host/cleaning/history", label: "Done" },
];

export default function HostCleaningSubnav() {
  const pathname = usePathname() || "";
  return (
    <nav aria-label="Cleaning" className="mb-6 flex gap-1 overflow-x-auto pb-1">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href ||
            (item.href !== "/host/cleaning/jobs" &&
              pathname.startsWith(`${item.href}/`)) ||
            (item.href === "/host/cleaning/jobs" &&
              pathname.startsWith("/host/cleaning/jobs") &&
              !pathname.startsWith("/host/cleaning/jobs/new"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              active
                ? "bg-[var(--kama-ink)] text-white"
                : "text-[var(--kama-ink-muted)] hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
