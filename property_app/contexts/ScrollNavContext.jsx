"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const ScrollNavContext = createContext({
  navVisible: true,
});

export function ScrollNavProvider({ children }) {
  const [navVisible, setNavVisible] = useState(true);
  const lastY = useRef(0);
  const frame = useRef(0);

  const onScroll = useCallback(() => {
    if (frame.current) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0;
      const y = window.scrollY || 0;
      const delta = y - lastY.current;
      const threshold = 8;

      if (y < 32) {
        setNavVisible(true);
      } else if (delta > threshold) {
        setNavVisible(false);
      } else if (delta < -threshold) {
        setNavVisible(true);
      }
      lastY.current = y;
    });
  }, []);

  useEffect(() => {
    lastY.current = window.scrollY || 0;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [onScroll]);

  return (
    <ScrollNavContext.Provider value={{ navVisible }}>
      {children}
    </ScrollNavContext.Provider>
  );
}

export function useScrollNav() {
  return useContext(ScrollNavContext);
}
