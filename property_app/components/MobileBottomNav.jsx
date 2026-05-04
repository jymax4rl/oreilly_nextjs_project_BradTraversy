"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  Compass,
  Building2,
  Heart,
  MessageCircle,
  CircleUserRound,
} from "lucide-react";
import { useScrollNav } from "@/contexts/ScrollNavContext";
import { useMenuOverlay } from "@/contexts/MenuOverlayContext";

export default function MobileBottomNav() {
  const pathname = usePathname() || "";
  const { navVisible } = useScrollNav();
  const { toggle } = useMenuOverlay();
  const { data: session } = useSession();

  const active = (check) => (check ? "text-[#00C8FF]" : "text-zinc-400");

  return (
    <nav
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white transition-transform duration-300 ease-out will-change-transform ${
        navVisible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary mobile navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        <Link
          href="/"
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active(pathname === "/")}`}
        >
          <Compass className="h-6 w-6" strokeWidth={pathname === "/" ? 2.25 : 1.75} />
          Explore
        </Link>

        <Link
          href="/properties"
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active(
            pathname.startsWith("/properties"),
          )}`}
        >
          <Building2 className="h-6 w-6" strokeWidth={pathname.startsWith("/properties") ? 2.25 : 1.75} />
          Browse
        </Link>

        <Link
          href="/saved-properties"
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active(
            pathname.startsWith("/saved-properties"),
          )}`}
        >
          <Heart className="h-6 w-6" strokeWidth={pathname.startsWith("/saved-properties") ? 2.25 : 1.75} />
          Saved
        </Link>

        <button
          type="button"
          disabled
          className="flex flex-1 cursor-not-allowed flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-zinc-300"
          aria-disabled="true"
        >
          <MessageCircle className="h-6 w-6 opacity-50" />
          Messages
        </button>

        {session ? (
          <button
            type="button"
            onClick={toggle}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-zinc-500"
          >
            <CircleUserRound className="h-6 w-6" />
            Menu
          </button>
        ) : (
          <button
            type="button"
            onClick={() => signIn("google")}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-zinc-500"
          >
            <CircleUserRound className="h-6 w-6" />
            Log in
          </button>
        )}
      </div>
    </nav>
  );
}
