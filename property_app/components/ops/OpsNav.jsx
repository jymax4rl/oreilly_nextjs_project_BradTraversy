"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";
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
  MessageSquare,
  BookOpen,
  Ellipsis,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

/**
 * Desktop rail shows every item.
 * Mobile bottom bar only shows `mobile: "tab"` items + a More sheet for the rest,
 * so new console sections do not keep crowding the tab bar.
 */
const NAV = [
  { href: "/ops", label: "Home", exact: true, Icon: Home, mobile: "tab" },
  {
    href: "/ops/analytics",
    label: "Analytics",
    Icon: BarChart3,
    mobile: "tab",
  },
  { href: "/ops/listings", label: "Listings", Icon: LayoutList, mobile: "tab" },
  {
    href: "/ops/reservations",
    label: "Reservations",
    Icon: CalendarCheck,
    mobile: "tab",
  },
  {
    href: "/documentation",
    label: "Docs",
    Icon: BookOpen,
    mobile: "more",
  },
  { href: "/ops/users", label: "Users", Icon: Users, mobile: "more" },
  {
    href: "/ops/messages",
    label: "Messages",
    Icon: MessageSquare,
    mobile: "more",
  },
  { href: "/ops/hosts", label: "Hosts", Icon: Building2, mobile: "more" },
  {
    href: "/ops/founding-hosts",
    label: "Founding",
    Icon: Award,
    mobile: "more",
  },
  {
    href: "/ops/transactions",
    label: "Payments",
    Icon: CreditCard,
    mobile: "more",
  },
  {
    href: "/ops/marketing",
    label: "Marketing",
    Icon: Megaphone,
    mobile: "more",
  },
];

const MOBILE_TABS = NAV.filter((item) => item.mobile === "tab");
const MOBILE_MORE = NAV.filter((item) => item.mobile !== "tab");

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
  const [moreOpen, setMoreOpen] = useState(false);
  const morePanelId = useId();
  const moreButtonRef = useRef(null);
  const morePanelRef = useRef(null);

  const moreActive = MOBILE_MORE.some((item) => navActive(pathname, item));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const previouslyFocused = document.activeElement;
    const firstLink = morePanelRef.current?.querySelector("a, button");
    firstLink?.focus?.();

    return () => {
      document.removeEventListener("keydown", onKey);
      if (
        previouslyFocused instanceof HTMLElement &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      } else {
        moreButtonRef.current?.focus?.();
      }
    };
  }, [moreOpen]);

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
          <p
            className="ops-side-text ops-rail-email"
            title={session?.user?.email || ""}
          >
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

      {moreOpen ? (
        <button
          type="button"
          className="ops-more-backdrop"
          aria-label="Close more menu"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}

      <div
        ref={morePanelRef}
        id={morePanelId}
        className={`ops-more-sheet ${moreOpen ? "ops-more-sheet--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="More ops sections"
        aria-hidden={!moreOpen}
        inert={!moreOpen ? true : undefined}
      >
        <div className="ops-more-sheet__handle" aria-hidden />
        <p className="ops-more-sheet__title">More</p>
        <nav className="ops-more-sheet__nav" aria-label="More ops sections">
          {MOBILE_MORE.map((item) => {
            const active = navActive(pathname, item);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`ops-more-link ${active ? "ops-more-link--active" : ""}`}
              >
                <span className="ops-more-link__icon">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <nav className="ops-bottom-nav" aria-label="Ops sections">
        {MOBILE_TABS.map((item) => {
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
        <button
          ref={moreButtonRef}
          type="button"
          className={`ops-bottom-link ${
            moreOpen || moreActive ? "ops-bottom-link--active" : ""
          }`}
          aria-label="More ops sections"
          aria-expanded={moreOpen}
          aria-controls={morePanelId}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <Ellipsis className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
