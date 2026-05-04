"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import KamaLogo from "@/assets/images/Kama logo - blue.svg";
import Hamburger from "@/components/hamburger";
import { useScrollNav } from "@/contexts/ScrollNavContext";
import { useMenuOverlay } from "@/contexts/MenuOverlayContext";

const TABS = [
  { href: "/", label: "Stays", match: (p) => p === "/" },
  {
    href: "/properties",
    label: "Homes",
    match: (p) => p.startsWith("/properties") && p !== "/properties/add",
  },
  {
    href: "/saved-properties",
    label: "Saved",
    match: (p) => p.startsWith("/saved-properties"),
  },
];

export default function MobileTopChrome() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { navVisible } = useScrollNav();
  const { toggle, isOpen } = useMenuOverlay();

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
      className={`lg:hidden fixed left-0 right-0 top-0 z-50 bg-white shadow-sm transition-transform duration-300 ease-out will-change-transform ${
        navVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="border-b border-zinc-100 pt-2 [padding-top:max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 px-3 py-2">
          <Link href="/" className="shrink-0" aria-label="Kama Properties home">
            <Image
              src={KamaLogo}
              alt="Kama Properties"
              className="w-[5.25rem] h-10 object-contain object-left"
              width={120}
              height={40}
            />
          </Link>

          <form
            role="search"
            onSubmit={submitSearch}
            className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 shadow-md shadow-zinc-900/5"
          >
            <Search
              className="h-4 w-4 shrink-0 text-zinc-500 pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, country, area…"
              enterKeyHint="search"
              autoComplete="street-address"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-900 placeholder:text-zinc-500 focus:outline-none"
              aria-label="Search by location"
            />
          </form>

          <div className="shrink-0 flex items-center justify-center">
            <Hamburger clickFunc={toggle} checked={isOpen} />
          </div>
        </div>

        <nav
          className="flex justify-around px-2 pb-0 pt-1"
          aria-label="Browse categories"
        >
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex-1 py-2.5 text-center text-sm font-medium"
              >
                <span
                  className={
                    active ? "text-zinc-900" : "text-zinc-500 tracking-tight"
                  }
                >
                  {tab.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-zinc-900" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
