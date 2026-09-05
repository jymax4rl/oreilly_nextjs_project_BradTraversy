"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Home,
  Users,
  Building2,
  LayoutList,
  CalendarCheck,
  CreditCard,
  Megaphone,
  LogOut,
  Award,
  BarChart3,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const NAV = [
  { href: "/ops", label: "Home", exact: true, Icon: Home },
  { href: "/ops/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/ops/users", label: "Users", Icon: Users },
  { href: "/ops/hosts", label: "Hosts", Icon: Building2 },
  { href: "/ops/founding-hosts", label: "Founding", Icon: Award },
  { href: "/ops/listings", label: "Listings", Icon: LayoutList },
  { href: "/ops/reservations", label: "Reservations", Icon: CalendarCheck },
  { href: "/ops/transactions", label: "Payments", Icon: CreditCard },
  { href: "/ops/marketing", label: "Marketing", Icon: Megaphone },
];

function navActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLinks({ pathname, onNavigate }) {
  return (
    <nav className="ops-rail-nav" aria-label="Ops console">
      {NAV.map((item) => {
        const active = navActive(pathname, item);
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`ops-side-link ${active ? "ops-side-link--active" : ""}`}
          >
            <span className="ops-side-icon-wrap">
              <Icon className="ops-side-icon" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="ops-side-text">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function OpsNav() {
  const pathname = usePathname() || "";
  const { data: session } = useSession();

  return (
    <>
      <header className="ops-mobile-top">
        <BrandLogo href="/ops" className="h-7 w-7" />
        <p className="ops-mobile-top__title">Operations</p>
        <button
          type="button"
          className="ops-mobile-top__out"
          onClick={() => signOut({ callbackUrl: "/ops/login" })}
        >
          Sign out
        </button>
      </header>

      <aside className="ops-sidebar">
        <div className="ops-rail-brand">
          <div className="ops-rail-mark">
            <BrandLogo
              href="/ops"
              className="h-6 w-6"
              linkClassName="grid h-full w-full place-items-center"
            />
          </div>
          <div className="ops-side-text ops-rail-brand-copy">
            <p className="ops-rail-kicker">Isisel</p>
            <p className="ops-rail-name">Operations</p>
          </div>
        </div>

        <NavLinks pathname={pathname} />

        <div className="ops-rail-foot">
          <p className="ops-side-text ops-rail-email" title={session?.user?.email || ""}>
            {session?.user?.email}
          </p>
          <button
            type="button"
            className="ops-side-link ops-signout"
            title="Sign out"
            aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: "/ops/login" })}
          >
            <span className="ops-side-icon-wrap">
              <LogOut className="ops-side-icon" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="ops-side-text">Sign out</span>
          </button>
        </div>
      </aside>

      <nav className="ops-bottom-nav" aria-label="Ops sections">
        {NAV.map((item) => {
          const active = navActive(pathname, item);
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`ops-bottom-link ${active ? "ops-bottom-link--active" : ""}`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
