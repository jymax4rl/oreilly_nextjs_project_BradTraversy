"use client";

import { isExploreMobileLayout } from "@/utils/exploreLayout";
import { isFullscreenRoute } from "@/utils/fullscreenRoutes";
import { usePathname } from "next/navigation";

export default function MainShell({ children }) {
  const pathname = usePathname() || "";
  const explore = isExploreMobileLayout(pathname);
  const fullscreen = isFullscreenRoute(pathname);
  const isHome = pathname === "/";

  return (
    <main
      id="main-content"
      className={
        fullscreen
          ? "flex-grow m-0 min-h-dvh overflow-x-hidden p-0 lg:pt-0"
          : isHome
            ? "flex-grow m-0 overflow-x-hidden p-0 pt-0 pb-[var(--kama-chrome-clearance)] lg:pb-0"
            : explore
              ? "flex-grow overflow-x-hidden pt-[4.75rem] pb-[var(--kama-chrome-clearance)] lg:pt-0 lg:pb-0"
              : "flex-grow overflow-x-hidden pt-[8vh] pb-[var(--kama-chrome-clearance)] lg:pb-0 lg:pt-0"
      }
    >
      {children}
    </main>
  );
}
