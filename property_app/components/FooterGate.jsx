"use client";

import { isFullscreenRoute } from "@/utils/fullscreenRoutes";
import { usePathname } from "next/navigation";

export default function FooterGate({ children }) {
  const pathname = usePathname() || "";
  if (isFullscreenRoute(pathname)) return null;
  // Airbnb-style catalog explore owns the viewport on desktop.
  if (pathname === "/properties" || pathname.startsWith("/properties?")) {
    return null;
  }
  return children;
}
