"use client";

import { isExploreMobileLayout } from "@/utils/exploreLayout";
import { usePathname } from "next/navigation";

export default function MainShell({ children }) {
  const pathname = usePathname() || "";
  const explore = isExploreMobileLayout(pathname);

  return (
    <main
      id="main-content"
      className={
        explore
          ? "flex-grow pt-[7.75rem] pb-20 lg:pt-0 lg:pb-0"
          : "flex-grow pt-[8vh] lg:pt-0"
      }
    >
      {children}
    </main>
  );
}
