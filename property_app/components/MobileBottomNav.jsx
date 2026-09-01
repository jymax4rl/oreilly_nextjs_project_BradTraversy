"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Building2,
  Heart,
  MessageCircle,
  CircleUserRound,
  MapPin,
} from "lucide-react";
import { useScrollNav } from "@/contexts/ScrollNavContext";
import { useMenuOverlay } from "@/contexts/MenuOverlayContext";
import { getUnreadMessageCount } from "@/utils/actions/messageActions";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Primary mobile tab bar.
 * Explore uses outline MapPin (never a filled letter circle).
 * Never mounts Currency here.
 */
export default function MobileBottomNav() {
  const pathname = usePathname() || "";
  const { navVisible } = useScrollNav();
  const { toggle } = useMenuOverlay();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    getUnreadMessageCount().then(setUnreadCount).catch(() => {});
  }, [session, pathname]);

  const itemClass = (on) =>
    `relative z-10 flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium ${
      on ? "text-[var(--kama-accent)]" : "text-[var(--kama-ink-muted)]"
    }`;

  return (
    <nav
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-[70] isolate border-t border-[var(--kama-border)] bg-[var(--kama-surface)] transition-transform duration-300 ease-out will-change-transform ${
        navVisible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary mobile navigation"
      data-mobile-bottom-nav
    >
      <div className="relative z-10 mx-auto flex max-w-lg items-stretch justify-around px-1 pt-0.5">
        <Link
          href="/"
          className={itemClass(pathname === "/")}
          aria-label={t("mobileNav.explore")}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <MapPin
            className="h-6 w-6 shrink-0 fill-none stroke-current"
            strokeWidth={pathname === "/" ? 2.25 : 1.75}
            aria-hidden
          />
          <span className="leading-none">{t("mobileNav.explore")}</span>
        </Link>

        <Link
          href="/properties"
          className={itemClass(pathname.startsWith("/properties"))}
          aria-current={
            pathname.startsWith("/properties") ? "page" : undefined
          }
        >
          <Building2
            className="h-6 w-6 shrink-0 fill-none stroke-current"
            strokeWidth={pathname.startsWith("/properties") ? 2.25 : 1.75}
            aria-hidden
          />
          <span className="leading-none">{t("mobileNav.browse")}</span>
        </Link>

        <Link
          href="/saved-properties"
          className={itemClass(pathname.startsWith("/saved-properties"))}
          aria-current={
            pathname.startsWith("/saved-properties") ? "page" : undefined
          }
        >
          <Heart
            className="h-6 w-6 shrink-0 fill-none stroke-current"
            strokeWidth={
              pathname.startsWith("/saved-properties") ? 2.25 : 1.75
            }
            aria-hidden
          />
          <span className="leading-none">{t("mobileNav.saved")}</span>
        </Link>

        <Link
          href="/messages"
          className={itemClass(pathname.startsWith("/messages"))}
          aria-current={pathname.startsWith("/messages") ? "page" : undefined}
        >
          <span className="relative inline-flex">
            <MessageCircle
              className="h-6 w-6 shrink-0 fill-none stroke-current"
              strokeWidth={pathname.startsWith("/messages") ? 2.25 : 1.75}
              aria-hidden
            />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--kama-danger)] px-0.5 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          <span className="leading-none">{t("mobileNav.messages")}</span>
        </Link>

        <button
          type="button"
          onClick={toggle}
          className={itemClass(false)}
          aria-label={t("mobileNav.openMenu")}
        >
          <CircleUserRound
            className="h-6 w-6 shrink-0 fill-none stroke-current"
            aria-hidden
          />
          <span className="leading-none">
            {session ? t("mobileNav.menu") : t("mobileNav.more")}
          </span>
        </button>
      </div>
    </nav>
  );
}
