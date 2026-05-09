"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { isExploreMobileLayout } from "@/utils/exploreLayout";
import MobileTopChrome from "@/components/MobileTopChrome";

export default function MobileTopChromeGate() {
  const pathname = usePathname() || "";
  if (!isExploreMobileLayout(pathname)) return null;
  return (
    <Suspense fallback={null}>
      <MobileTopChrome />
    </Suspense>
  );
}
