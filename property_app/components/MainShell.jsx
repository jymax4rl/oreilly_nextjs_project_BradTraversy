"use client";

import { isExploreMobileLayout } from "@/utils/exploreLayout";
import { usePathname } from "next/navigation";

function isFullHeightFormLayout(pathname) {
  return pathname === "/properties/add";
}

export default function MainShell({ children }) {
  const pathname = usePathname() || "";
  const explore = isExploreMobileLayout(pathname);
  const fullHeightForm = isFullHeightFormLayout(pathname);

  return (
    <main
      id="main-content"
      className={
        fullHeightForm
          ? "flex min-h-0 flex-1 flex-col overflow-hidden pt-0"
          : explore
            ? "flex-grow pt-[7.75rem] pb-20 lg:pt-0 lg:pb-0"
            : "flex-grow pt-[8vh] lg:pt-0"
      }
    >
      {children}
    </main>
  );
}
