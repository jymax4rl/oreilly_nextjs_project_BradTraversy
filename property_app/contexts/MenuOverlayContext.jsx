"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const MenuOverlayContext = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export function MenuOverlayProvider({ children }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
    }),
    [isOpen, open, close, toggle],
  );

  return (
    <MenuOverlayContext.Provider value={value}>
      {children}
    </MenuOverlayContext.Provider>
  );
}

export function useMenuOverlay() {
  return useContext(MenuOverlayContext);
}
