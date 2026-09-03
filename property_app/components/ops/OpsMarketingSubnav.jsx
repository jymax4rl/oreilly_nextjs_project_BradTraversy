"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "@/components/ops/acquisition/acquisition.css";

const ITEMS = [
  { href: "/ops/marketing", label: "Outreach", exact: true },
  { href: "/ops/marketing/acquisition", label: "Host Acquisition", exact: true },
  { href: "/ops/marketing/acquisition/copilot", label: "Sales Copilot" },
  { href: "/ops/marketing/creators", label: "Creator Leads", exact: true },
];

export default function OpsMarketingSubnav() {
  const pathname = usePathname() || "";
  return (
    <div className="ops-nav-pills mb-5" role="tablist" aria-label="Marketing">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`ops-pill ${active ? "ops-pill--on" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
