"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

const ScrollNavContext = createContext({
  navVisible: true,
  bottomChromeVisible: true,
});

function isImmersivePath(pathname) {
  return (
    pathname === "/" ||
    pathname === "/business" ||
    pathname.startsWith("/influencers") ||
    pathname.startsWith("/investors") ||
    pathname.startsWith("/about")
  );
}

export function ScrollNavProvider({ children }) {
  const pathname = usePathname() || "";
  const immersive = isImmersivePath(pathname);
  const [navVisible, setNavVisible] = useState(true);
  const [bottomChromeVisible, setBottomChromeVisible] = useState(!immersive);
  const lastY = useRef(0);
  const frame = useRef(0);
  const immersiveRef = useRef(immersive);

  immersiveRef.current = immersive;

  const onScroll = useCallback(() => {
    if (frame.current) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0;
      const y = window.scrollY || 0;
      const delta = y - lastY.current;
      const threshold = 8;

      if (immersiveRef.current) {
        setBottomChromeVisible(y > 56);
        lastY.current = y;
        return;
      }

      if (y < 32) {
        setNavVisible(true);
        setBottomChromeVisible(true);
      } else if (delta > threshold) {
        setNavVisible(false);
        setBottomChromeVisible(false);
      } else if (delta < -threshold) {
        setNavVisible(true);
        setBottomChromeVisible(true);
      }
      lastY.current = y;
    });
  }, []);

  useEffect(() => {
    lastY.current = window.scrollY || 0;
    if (isImmersivePath(pathname)) {
      setNavVisible(true);
      setBottomChromeVisible((window.scrollY || 0) > 56);
      document.documentElement.classList.add("kama-photo-hero");
    } else {
      setNavVisible(true);
      setBottomChromeVisible(true);
      document.documentElement.classList.remove("kama-photo-hero");
    }
    return () => {
      document.documentElement.classList.remove("kama-photo-hero");
    };
  }, [pathname]);

  useEffect(() => {
    lastY.current = window.scrollY || 0;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [onScroll]);

  return (
    <ScrollNavContext.Provider value={{ navVisible, bottomChromeVisible }}>
      {children}
    </ScrollNavContext.Provider>
  );
}

export function useScrollNav() {
  return useContext(ScrollNavContext);
}
