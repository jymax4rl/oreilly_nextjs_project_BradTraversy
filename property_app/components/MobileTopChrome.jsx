"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import Hamburger from "@/components/hamburger";
import { useScrollNav } from "@/contexts/ScrollNavContext";
import { useMenuOverlay } from "@/contexts/MenuOverlayContext";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/** Listing detail or host tools: /properties/[id](/calendar|/rates|/message|/reservations). */
function isPropertyScopedPath(pathname) {
  return /^\/properties\/[^/]+(?:\/(?:calendar|rates|message|reservations))?$/.test(
    pathname || "",
  );
}

/**
 * Mobile top chrome.
 * Home: logo + menu (hero search is primary).
 * Property detail / host calendar & rates: logo + menu only — search overflows.
 * Elsewhere: logo + location search + menu.
 */
export default function MobileTopChrome() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { navVisible } = useScrollNav();
  const { toggle, isOpen } = useMenuOverlay();
  const { t } = useLanguage();
  const isHome = pathname === "/";
  const hideSearch = isHome || isPropertyScopedPath(pathname);

  const [location, setLocation] = useState("");

  useEffect(() => {
    setLocation(searchParams.get("location") || "");
  }, [searchParams]);

  function submitSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = location.trim();
    if (q) params.set("location", q);
    const qs = params.toString();
    router.push(`/properties${qs ? `?${qs}` : ""}`);
    router.refresh();
  }

  return (
    <div
      className={`lg:hidden fixed left-0 right-0 top-0 z-50 transition-transform duration-300 ease-out will-change-transform ${
        navVisible ? "translate-y-0" : "-translate-y-full"
      } ${
        isHome || isPropertyScopedPath(pathname)
          ? "border-b border-[var(--kama-border)] bg-[color-mix(in_srgb,var(--kama-canvas)_78%,transparent)] shadow-none backdrop-blur-xl"
          : "border-b border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-sm"
      }`}
    >
      <div className="pt-2 [padding-top:max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 px-3 py-2.5 pb-3">
          <BrandLogo
            className="h-9 w-auto"
            priority={isHome}
            linkClassName="shrink-0 inline-flex items-center"
          />

          {!hideSearch && (
            <form
              role="search"
              onSubmit={submitSearch}
              className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--kama-border)] bg-[var(--kama-surface)] px-3 py-2 shadow-md shadow-[rgba(12,26,26,0.05)]"
            >
              <Search
                className="pointer-events-none h-4 w-4 shrink-0 text-[var(--kama-ink-muted)]"
                aria-hidden
              />
              <input
                type="search"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("search.locationShort")}
                enterKeyHint="search"
                autoComplete="street-address"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--kama-ink)] placeholder:text-[var(--kama-ink-muted)] focus:outline-none"
                aria-label={t("search.searchLocation")}
              />
            </form>
          )}

          {hideSearch && <div className="min-w-0 flex-1" aria-hidden />}

          <div className="flex shrink-0 items-center justify-center">
            <Hamburger clickFunc={toggle} checked={isOpen} />
          </div>
        </div>
      </div>
    </div>
  );
}
