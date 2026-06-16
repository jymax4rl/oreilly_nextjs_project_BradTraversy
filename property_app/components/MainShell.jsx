"use client";

import { isExploreMobileLayout } from "@/utils/exploreLayout";
import { isFullscreenRoute } from "@/utils/fullscreenRoutes";
import { usePathname } from "next/navigation";

export default function MainShell({ children }) {
  const pathname = usePathname() || "";
  const explore = isExploreMobileLayout(pathname);
  const fullscreen = isFullscreenRoute(pathname);

  return (
    <main
      id="main-content"
      className={
        fullscreen
          ? "flex-grow m-0 min-h-dvh p-0 lg:pt-0"
          : explore
            ? "flex-grow pt-[7.75rem] pb-20 lg:pt-0 lg:pb-0"
            : "flex-grow pt-[8vh] lg:pt-0"
      }
    >
      {children}
    </main>
  );
}
