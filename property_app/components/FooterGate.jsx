"use client";

import { isFullscreenRoute } from "@/utils/fullscreenRoutes";
import { usePathname } from "next/navigation";

export default function FooterGate({ children }) {
  const pathname = usePathname() || "";
  if (isFullscreenRoute(pathname)) return null;
  if (pathname === "/horizon" || pathname.startsWith("/horizon/")) return null;
  return children;
}
