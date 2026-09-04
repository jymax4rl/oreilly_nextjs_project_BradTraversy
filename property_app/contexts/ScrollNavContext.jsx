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
  tabBarVisible: true,
  tabBarCompact: false,
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
  const [tabBarVisible, setTabBarVisible] = useState(!immersive);
  const [tabBarCompact, setTabBarCompact] = useState(false);
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
      const threshold = 16;

      if (immersiveRef.current) {
        const show = y > 56;
        setBottomChromeVisible(show);
        setTabBarVisible(show);
        if (!show) {
          setTabBarCompact(false);
        } else if (delta > threshold && y > 96) {
          setTabBarCompact(true);
        } else if (delta < -threshold) {
          setTabBarCompact(false);
        }
        lastY.current = y;
        return;
      }

      if (y < 32) {
        setNavVisible(true);
        setBottomChromeVisible(true);
        setTabBarVisible(true);
        setTabBarCompact(false);
      } else if (delta > threshold) {
        setNavVisible(false);
        setBottomChromeVisible(false);
        setTabBarVisible(true);
        setTabBarCompact(true);
      } else if (delta < -threshold) {
        setNavVisible(true);
        setBottomChromeVisible(true);
        setTabBarVisible(true);
        setTabBarCompact(false);
      }
      lastY.current = y;
    });
  }, []);

  useEffect(() => {
    lastY.current = window.scrollY || 0;
    if (isImmersivePath(pathname)) {
      setNavVisible(true);
      const show = (window.scrollY || 0) > 56;
      setBottomChromeVisible(show);
      setTabBarVisible(show);
      setTabBarCompact(false);
      document.documentElement.classList.add("kama-photo-hero");
    } else {
      setNavVisible(true);
      setBottomChromeVisible(true);
      setTabBarVisible(true);
      setTabBarCompact(false);
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
    <ScrollNavContext.Provider
      value={{ navVisible, bottomChromeVisible, tabBarVisible, tabBarCompact }}
    >
      {children}
    </ScrollNavContext.Provider>
  );
}

export function useScrollNav() {
  return useContext(ScrollNavContext);
}
