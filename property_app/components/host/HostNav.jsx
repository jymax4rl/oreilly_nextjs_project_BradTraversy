"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  CalendarCheck,
  CalendarRange,
  BarChart3,
  LayoutDashboard,
  MessageSquare,
  Plus,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { getHostNavCounts } from "@/utils/host/navCounts";
import { isOpsStaff } from "@/utils/opsAuth";
import "./host-nav.css";

const NAV = [
  { href: "/host", labelKey: "hostConsole.home", exact: true, Icon: LayoutDashboard },
  { href: "/host/reservations", labelKey: "hostConsole.reservations", Icon: CalendarCheck },
  { href: "/host/calendar", labelKey: "hostConsole.resCal.nav", Icon: CalendarRange },
  { href: "/host/insights", labelKey: "hostConsole.insights.nav", Icon: BarChart3 },
  { href: "/host/listings", labelKey: "hostConsole.listings", Icon: Building2 },
  { href: "/host/messages", labelKey: "hostConsole.inbox", Icon: MessageSquare },
];

function navActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function overflowState(el) {
  if (!el) return "none";
  const max = el.scrollWidth - el.clientWidth;
  if (max <= 2) return "none";
  const start = el.scrollLeft > 4;
  const end = el.scrollLeft < max - 4;
  if (start && end) return "both";
  if (start) return "start";
  if (end) return "end";
  return "none";
}

export default function HostNav() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { data: session } = useSession();
  const { t, lang } = useLanguage();
  const [unread, setUnread] = useState(0);
  const [pending, setPending] = useState(0);
  const [pill, setPill] = useState({ x: 0, w: 0, ready: false });
  const [overflow, setOverflow] = useState("none");
  const railRef = useRef(null);
  const itemRefs = useRef([]);
  const staff = isOpsStaff(session?.user?.role);
  const activeIndex = NAV.findIndex((item) => navActive(pathname, item));

  useEffect(() => {
    if (!session?.user) return;
    getHostNavCounts()
      .then((counts) => {
        setUnread(counts.unreadMessages || 0);
        setPending(counts.pendingReservations || 0);
      })
      .catch(() => {});
  }, [session, pathname]);

  const syncRail = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setOverflow(overflowState(rail));

    const item = itemRefs.current[activeIndex];
    if (!item) {
      setPill((prev) => ({ ...prev, ready: false }));
      return;
    }

    // Pill lives inside the scroller, so x is content coordinates (offset + scroll).
    setPill({
      x: item.offsetLeft,
      w: item.offsetWidth,
      ready: true,
    });
  }, [activeIndex]);

  useLayoutEffect(() => {
    syncRail();
  }, [syncRail, unread, pending, pathname, lang]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    const onScroll = () => setOverflow(overflowState(rail));
    rail.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(syncRail);
    ro.observe(rail);

    return () => {
      rail.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [syncRail]);

  useEffect(() => {
    const rail = railRef.current;
    const item = itemRefs.current[activeIndex];
    if (!rail || !item) return;
    const clipped =
      item.offsetLeft < rail.scrollLeft + 8 ||
      item.offsetLeft + item.offsetWidth > rail.scrollLeft + rail.clientWidth - 8;
    if (!clipped) return;
    // Scroll only the rail — scrollIntoView would also move the page.
    rail.scrollTo({
      left: item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [activeIndex]);

  return (
    <header className="kama-safe-top sticky top-0 z-[60] border-b border-[var(--kama-border)] bg-[var(--kama-surface)]/90 shadow-[0_8px_28px_-20px_rgba(27,92,87,0.45)] backdrop-blur-md">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex h-12 items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandLogo href="/host" className="h-8 w-auto" />
            <span className="hidden h-4 w-px bg-[var(--kama-border-strong)] sm:block" />
            <span className="hidden rounded-full bg-[var(--kama-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kama-accent)] sm:inline">
              {t("hostConsole.badge")}
            </span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <LanguageToggle className="shrink-0" />
            <Link
              href="/properties/add"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--kama-accent)] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--kama-accent-hover)] sm:px-3"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="hidden sm:inline">{t("hostConsole.listStay")}</span>
            </Link>
            <Link
              href="/"
              className="rounded-full px-2.5 py-1.5 text-xs font-medium text-[var(--kama-ink-muted)] transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)]"
            >
              {t("hostConsole.viewSite")}
            </Link>
            {staff ? (
              <Link
                href="/ops"
                className="hidden rounded-full px-2.5 py-1.5 text-xs font-medium text-[var(--kama-ink-muted)] transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)] md:inline"
              >
                {t("hostConsole.ops")}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="px-3 pb-3 sm:px-6">
          <div className="rounded-full bg-[var(--kama-field)] p-1 ring-1 ring-[var(--kama-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="host-nav-fade" data-overflow={overflow}>
              <nav
                ref={railRef}
                aria-label={t("hostConsole.navAria")}
                className="host-nav-rail relative flex items-stretch gap-0 overflow-x-auto"
              >
                <span
                  aria-hidden
                  className="host-nav-pill"
                  data-ready={pill.ready ? "true" : "false"}
                  style={{
                    transform: `translateX(${pill.x}px)`,
                    width: pill.w,
                  }}
                />
                {NAV.map((item, index) => {
                  const active = index === activeIndex;
                  const count =
                    item.href === "/host/messages"
                      ? unread
                      : item.href === "/host/reservations"
                        ? pending
                        : 0;
                  const Icon = item.Icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      ref={(el) => {
                        itemRefs.current[index] = el;
                      }}
                      onClick={() => {
                        if (item.href === "/host" && pathname === "/host") {
                          window.dispatchEvent(
                            new Event("kama-host-home-replay"),
                          );
                          router.refresh();
                        }
                      }}
                      className={`relative z-[1] flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold tracking-tight transition-colors sm:px-4 ${
                        active
                          ? "text-white"
                          : "text-[var(--kama-ink-muted)] hover:text-[var(--kama-ink)]"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="relative inline-flex h-3.5 w-3.5 shrink-0">
                        <Icon
                          className="h-3.5 w-3.5 opacity-90"
                          strokeWidth={active ? 2.4 : 2}
                        />
                        {count > 0 ? (
                          <span className="host-nav-count" aria-hidden>
                            {count > 9 ? "9+" : count}
                          </span>
                        ) : null}
                      </span>
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
