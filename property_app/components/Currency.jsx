"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Banknote, ChevronDown } from "lucide-react";
import { CURRENCIES } from "../utils/currencyUtils";
import { useCurrency } from "@/utils/CurrencyContext";

/**
 * Full currency pill only.
 * Portal variant opens a mobile bottom sheet (or fixed popover on lg+) so the
 * list never overlays home search fields or fights Lenis page scroll.
 */
const Currency = ({ align = "end", variant = "default", ...rest }) => {
  if (rest.compact || variant === "compact" || variant === "letter") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[Currency] compact/letter variants are removed — rendering full pill only.",
      );
    }
  }

  const { currencyCode, setCurrencyCode } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  const isPortal = variant === "portal";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || (isPortal && isMobile)) {
      setCoords(null);
      return;
    }

    const update = () => {
      const r = triggerRef.current.getBoundingClientRect();
      const width = Math.min(288, window.innerWidth - 24);
      let left = align === "end" ? r.right - width : r.left;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      const gap = 8;
      const spaceBelow = window.innerHeight - r.bottom - gap - 12;
      const spaceAbove = r.top - gap - 12;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(288, Math.max(160, openUp ? spaceAbove : spaceBelow));

      setCoords({
        left,
        width,
        maxHeight,
        top: openUp ? undefined : r.bottom + gap,
        bottom: openUp ? window.innerHeight - r.top + gap : undefined,
      });
    };

    update();
    window.addEventListener("resize", update);
    // Capture scroll from any ancestor (Lenis / overflow) without moving the sheet wrongly
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen, align, isPortal, isMobile]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const onPointer = (event) => {
      const t = event.target;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setIsOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });

    // Pause document scroll fighting while sheet/popover is open (esp. Lenis on desktop)
    const prevOverflow = document.documentElement.style.overflow;
    if (isPortal && isMobile) {
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [isOpen, isPortal, isMobile]);

  const handleSelect = (currency) => {
    setCurrencyCode(currency.code);
    setIsOpen(false);
  };

  const list = (
    <div
      className="overflow-y-auto overscroll-contain p-1.5"
      style={{
        maxHeight: coords?.maxHeight ?? "min(18rem, 50vh)",
        WebkitOverflowScrolling: "touch",
      }}
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      {CURRENCIES.map((c) => (
        <button
          key={c.code}
          type="button"
          role="option"
          aria-selected={selected.code === c.code}
          onClick={() => handleSelect(c)}
          className={`flex w-full min-h-[44px] min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm transition-colors sm:px-4 ${
            selected.code === c.code
              ? "bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]"
              : "text-[var(--kama-ink-muted)] hover:bg-[var(--kama-field)]"
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span className="shrink-0 font-bold">{c.code}</span>
            <span className="min-w-0 truncate font-medium opacity-70">
              {c.name.trim()}
            </span>
          </div>
          <span className="shrink-0 font-mono text-xs opacity-60">
            {c.symbol}
          </span>
        </button>
      ))}
    </div>
  );

  const menu =
    mounted && isOpen
      ? createPortal(
          isPortal && isMobile ? (
            <div
              className="fixed inset-0 z-[200] flex flex-col justify-end"
              role="presentation"
            >
              <button
                type="button"
                className="absolute inset-0 bg-[var(--kama-ink)]/25"
                aria-label="Close currency menu"
                onClick={() => setIsOpen(false)}
              />
              <div
                ref={menuRef}
                role="listbox"
                aria-label="Choose currency"
                data-lenis-prevent
                className="relative z-10 max-h-[min(52vh,24rem)] overflow-hidden rounded-t-3xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-2xl"
                style={{
                  paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                }}
              >
                <div className="flex items-center justify-between border-b border-[var(--kama-border)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--kama-ink)]">
                    Currency
                  </p>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-sm text-[var(--kama-ink-muted)]"
                    onClick={() => setIsOpen(false)}
                  >
                    Done
                  </button>
                </div>
                {list}
              </div>
            </div>
          ) : coords ? (
            <div
              ref={menuRef}
              role="listbox"
              aria-label="Choose currency"
              data-lenis-prevent
              className="fixed z-[200] overflow-hidden rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-xl"
              style={{
                left: coords.left,
                width: coords.width,
                top: coords.top,
                bottom: coords.bottom,
                maxHeight: coords.maxHeight,
              }}
            >
              {list}
            </div>
          ) : null,
          document.body,
        )
      : null;

  return (
    <div
      className="relative isolate"
      data-currency-control="pill"
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={`Currency ${selected.code}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={
          isPortal
            ? `home-currency-btn flex cursor-pointer items-center gap-1 rounded-md text-xs outline-none transition ${
                isOpen ? "border-[var(--kama-border-strong)]" : ""
              }`
            : `flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-2.5 shadow-sm outline-none transition hover:shadow-md focus:ring-2 focus:ring-[var(--kama-accent)]/20 ${
                isOpen
                  ? "border-[var(--kama-accent)] ring-2 ring-[var(--kama-accent)]/15"
                  : ""
              }`
        }
      >
        {!isPortal ? (
          <Banknote
            size={16}
            className="text-[var(--kama-accent)]"
            aria-hidden
          />
        ) : null}
        <span
          className={
            isPortal
              ? "font-medium tracking-wide"
              : "font-semibold tracking-wide text-[var(--kama-ink)]"
          }
        >
          {selected.code}
        </span>
        <span
          className={
            isPortal ? "opacity-70" : "text-sm text-[var(--kama-ink-muted)]"
          }
        >
          {isPortal ? selected.symbol : `(${selected.symbol})`}
        </span>
        <ChevronDown
          size={isPortal ? 12 : 14}
          className={`opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
};

export default Currency;
