"use client";

import { isExploreMobileLayout } from "@/utils/exploreLayout";
import { isFullscreenRoute } from "@/utils/fullscreenRoutes";
import { usePathname } from "next/navigation";

export default function MainShell({ children }) {
  const pathname = usePathname() || "";
  const explore = isExploreMobileLayout(pathname);
  const fullscreen = isFullscreenRoute(pathname);
  const isHome = pathname === "/";
  const isAudienceLanding =
    pathname === "/business" ||
    pathname.startsWith("/business/") ||
    pathname === "/influencers" ||
    pathname.startsWith("/influencers/") ||
    pathname === "/investors" ||
    pathname.startsWith("/investors/") ||
    pathname === "/about" ||
    pathname.startsWith("/about/") ||
    pathname === "/contact" ||
    pathname.startsWith("/contact/");

  return (
    <main
      id="main-content"
      className={
        fullscreen
          ? "flex-grow m-0 min-h-dvh overflow-x-hidden p-0 lg:pt-0"
          : isHome
            ? "flex-grow m-0 overflow-x-hidden p-0 pt-0 pb-0"
            : isAudienceLanding
              ? "flex-grow m-0 overflow-x-hidden p-0 pt-0 pb-0"
              : explore
              ? "flex-grow overflow-x-hidden pt-[4.75rem] pb-[var(--kama-chrome-clearance)] lg:pt-0 lg:pb-0"
              : "flex-grow overflow-x-hidden pt-[8vh] pb-[var(--kama-chrome-clearance)] lg:pb-0 lg:pt-0"
      }
    >
      {children}
    </main>
  );
}
