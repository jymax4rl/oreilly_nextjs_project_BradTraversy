"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/host/cleaning", label: "Overview", exact: true },
  { href: "/host/cleaning/jobs", label: "Cleanings" },
  { href: "/host/cleaning/calendar", label: "Calendar" },
  { href: "/host/cleaning/cleaners", label: "Cleaners" },
  { href: "/host/cleaning/requests", label: "Requests" },
  { href: "/host/cleaning/history", label: "History" },
  { href: "/host/cleaning/reviews", label: "Reviews" },
  { href: "/host/cleaning/settings", label: "Rules" },
];

export default function HostCleaningSubnav() {
  const pathname = usePathname() || "";
  return (
    <nav
      aria-label="Cleaning"
      className="mb-6 flex gap-1 overflow-x-auto pb-1"
    >
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
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
