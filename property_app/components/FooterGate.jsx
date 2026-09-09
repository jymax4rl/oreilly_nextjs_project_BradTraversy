"use client";

import { useEffect, useState } from "react";
import { isFullscreenRoute } from "@/utils/fullscreenRoutes";
import { usePathname } from "next/navigation";

export default function FooterGate({ children }) {
  const pathname = usePathname() || "";
  const [discoveryActive, setDiscoveryActive] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const sync = () => {
      setDiscoveryActive(
        document.body.classList.contains("home-discovery-active"),
      );
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  if (isFullscreenRoute(pathname)) return null;
  // Airbnb-style catalog explore owns the viewport on desktop.
  if (pathname === "/properties" || pathname.startsWith("/properties?")) {
    return null;
  }
  if (discoveryActive) return null;
  return children;
}
