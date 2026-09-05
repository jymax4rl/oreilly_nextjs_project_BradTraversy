"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
import { buildLiquidGlassMaps } from "@/utils/liquidGlass";
import "./mobile-bottom-nav.css";

/**
 * Primary mobile tab bar — kube.io liquid-glass dock (PWA).
 * Explore uses outline MapPin (never a filled letter circle).
 * Never mounts Currency here.
 */
export default function MobileBottomNav() {
  const pathname = usePathname() || "";
  const { tabBarVisible, tabBarCompact } = useScrollNav();
  const { toggle, isOpen } = useMenuOverlay();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const filterUid = useId().replace(/:/g, "");
  const filterId = `kama-liquid-${filterUid}`;

  const [unreadCount, setUnreadCount] = useState(0);
  const [pill, setPill] = useState({ x: 0, y: 0, w: 0, h: 0, ready: false });
  const [glass, setGlass] = useState(null);
  const dockRef = useRef(null);
  const itemRefs = useRef([]);

  const exploreOn = pathname === "/";
  const browseOn = pathname.startsWith("/properties");
  const savedOn = pathname.startsWith("/saved-properties");
  const messagesOn = pathname.startsWith("/messages");
  const activeIndex = isOpen
    ? 4
    : exploreOn
      ? 0
      : browseOn
        ? 1
        : savedOn
          ? 2
          : messagesOn
            ? 3
            : -1;

  const compact = tabBarCompact && !isOpen;

  useEffect(() => {
    if (!session?.user) return;
    getUnreadMessageCount().then(setUnreadCount).catch(() => {});
  }, [session, pathname]);

  const syncPill = useCallback(() => {
    const item = itemRefs.current[activeIndex];
    if (!item) {
      setPill((prev) => ({ ...prev, ready: false }));
      return;
    }
    const insetX = compact ? 5 : 6;
    const insetY = compact ? 4 : 5;
    setPill({
      x: item.offsetLeft + insetX,
      y: item.offsetTop + insetY,
      w: Math.max(0, item.offsetWidth - insetX * 2),
      h: Math.max(0, item.offsetHeight - insetY * 2),
      ready: true,
    });
  }, [activeIndex, compact]);

  const syncGlass = useCallback(() => {
    const dock = dockRef.current;
    if (!dock || typeof document === "undefined") return;
    const rect = dock.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    try {
      const maps = buildLiquidGlassMaps({
        width: rect.width,
        height: rect.height,
        borderRadius: rect.height * 0.5,
        bezelWidth: compact ? 12 : 16,
        glassThickness: compact ? 24 : 30,
        specularOpacity: 0.78,
        lightAngle: -58,
      });
      setGlass(maps);
    } catch {
      setGlass(null);
    }
  }, [compact]);

  useLayoutEffect(() => {
    syncPill();
    syncGlass();
    const frame = requestAnimationFrame(() => {
      syncPill();
      syncGlass();
    });
    const timer = window.setTimeout(() => {
      syncPill();
      syncGlass();
    }, 900);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [syncPill, syncGlass, unreadCount, t, compact]);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return undefined;
    const ro = new ResizeObserver(() => {
      syncPill();
      syncGlass();
    });
    ro.observe(dock);
    return () => ro.disconnect();
  }, [syncPill, syncGlass]);

  return (
    <nav
      className="kama-tabbar lg:hidden"
      data-hidden={tabBarVisible ? "false" : "true"}
      data-compact={compact ? "true" : "false"}
      aria-label="Primary mobile navigation"
      aria-hidden={!tabBarVisible}
      data-mobile-bottom-nav
    >
      {glass ? (
        <svg
          className="kama-tabbar__svg"
          aria-hidden
          focusable="false"
          colorInterpolationFilters="sRGB"
        >
          <defs>
            <filter
              id={filterId}
              x="0"
              y="0"
              width={glass.width}
              height={glass.height}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={glass.displacementMapUrl}
                x="0"
                y="0"
                width={glass.width}
                height={glass.height}
                result="dispMap"
                preserveAspectRatio="none"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="dispMap"
                scale={glass.scale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              {/* Frost after refraction so edges stay wavy but glossy (kube.io) */}
              <feGaussianBlur
                in="displaced"
                stdDeviation="1.1"
                result="refracted"
              />
              <feImage
                href={glass.specularMapUrl}
                x="0"
                y="0"
                width={glass.width}
                height={glass.height}
                result="specMap"
                preserveAspectRatio="none"
              />
              {/* Specular rim — screen-blend shine onto refracted backdrop */}
              <feBlend in="specMap" in2="refracted" mode="screen" />
            </filter>
          </defs>
        </svg>
      ) : null}

      <div
        ref={dockRef}
        className="kama-tabbar__dock"
        style={
          glass
            ? { ["--kama-liquid-filter"]: `url(#${filterId})` }
            : undefined
        }
      >
        <span className="kama-tabbar__lens" aria-hidden />
        <span className="kama-tabbar__shine" aria-hidden />
        <span className="kama-tabbar__rim" aria-hidden />
        <span
          aria-hidden
          className="kama-tabbar__active"
          data-ready={pill.ready ? "true" : "false"}
          style={{
            transform: `translate3d(${pill.x}px, ${pill.y}px, 0)`,
            width: pill.w,
            height: pill.h,
          }}
        />

        <Link
          href="/"
          ref={(el) => {
            itemRefs.current[0] = el;
          }}
          className="kama-tabbar__item"
          data-active={exploreOn && !isOpen ? "true" : "false"}
          aria-label={t("mobileNav.explore")}
          aria-current={exploreOn && !isOpen ? "page" : undefined}
        >
          <span className="kama-tabbar__icon">
            <MapPin
              className="h-full w-full shrink-0 fill-none stroke-current"
              strokeWidth={exploreOn && !isOpen ? 2.35 : 1.75}
              aria-hidden
            />
          </span>
          <span className="kama-tabbar__label">{t("mobileNav.explore")}</span>
        </Link>

        <Link
          href="/properties"
          ref={(el) => {
            itemRefs.current[1] = el;
          }}
          className="kama-tabbar__item"
          data-active={browseOn && !isOpen ? "true" : "false"}
          aria-current={browseOn && !isOpen ? "page" : undefined}
        >
          <span className="kama-tabbar__icon">
            <Building2
              className="h-full w-full shrink-0 fill-none stroke-current"
              strokeWidth={browseOn && !isOpen ? 2.35 : 1.75}
              aria-hidden
            />
          </span>
          <span className="kama-tabbar__label">{t("mobileNav.browse")}</span>
        </Link>

        <Link
          href="/saved-properties"
          ref={(el) => {
            itemRefs.current[2] = el;
          }}
          className="kama-tabbar__item"
          data-active={savedOn && !isOpen ? "true" : "false"}
          aria-current={savedOn && !isOpen ? "page" : undefined}
        >
          <span className="kama-tabbar__icon">
            <Heart
              className="h-full w-full shrink-0 fill-none stroke-current"
              strokeWidth={savedOn && !isOpen ? 2.35 : 1.75}
              aria-hidden
            />
          </span>
          <span className="kama-tabbar__label">{t("mobileNav.saved")}</span>
        </Link>

        <Link
          href="/messages"
          ref={(el) => {
            itemRefs.current[3] = el;
          }}
          className="kama-tabbar__item"
          data-active={messagesOn && !isOpen ? "true" : "false"}
          aria-current={messagesOn && !isOpen ? "page" : undefined}
        >
          <span className="kama-tabbar__icon relative">
            <MessageCircle
              className="h-full w-full shrink-0 fill-none stroke-current"
              strokeWidth={messagesOn && !isOpen ? 2.35 : 1.75}
              aria-hidden
            />
            {unreadCount > 0 ? (
              <span className="kama-tabbar__badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </span>
          <span className="kama-tabbar__label">{t("mobileNav.messages")}</span>
        </Link>

        <button
          type="button"
          ref={(el) => {
            itemRefs.current[4] = el;
          }}
          onClick={toggle}
          className="kama-tabbar__item"
          data-active={isOpen ? "true" : "false"}
          aria-label={t("mobileNav.openMenu")}
          aria-pressed={isOpen}
        >
          <span className="kama-tabbar__icon">
            <CircleUserRound
              className="h-full w-full shrink-0 fill-none stroke-current"
              strokeWidth={isOpen ? 2.35 : 1.75}
              aria-hidden
            />
          </span>
          <span className="kama-tabbar__label">
            {session ? t("mobileNav.menu") : t("mobileNav.more")}
          </span>
        </button>
      </div>
    </nav>
  );
}
