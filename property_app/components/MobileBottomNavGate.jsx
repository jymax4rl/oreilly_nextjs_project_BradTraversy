"use client";

import { usePathname } from "next/navigation";
import { isExploreMobileLayout } from "@/utils/exploreLayout";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function MobileBottomNavGate() {
  const pathname = usePathname() || "";
  if (!isExploreMobileLayout(pathname)) return null;
  return <MobileBottomNav />;
}
