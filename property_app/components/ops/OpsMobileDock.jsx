"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ellipsis } from "lucide-react";
import {
  OPS_MOBILE_MORE,
  OPS_MOBILE_TABS,
  opsNavActive,
} from "@/components/ops/opsNavItems";
import "@/components/ops/ops-mobile-dock.css";

/**
 * Ops mobile dock — APPROVED 2026-09-10 (docs/OPS_MOBILE_DOCK.md).
 * In-flow footer of the ops viewport shell; content scrolls above it.
 * More sheet portals to body so overflow:hidden on the shell cannot clip it.
 * Do NOT convert the dock itself to position:fixed.
 */
export default function OpsMobileDock() {
  const pathname = usePathname() || "";
  const [moreOpen, setMoreOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const morePanelId = useId();
  const moreButtonRef = useRef(null);
  const morePanelRef = useRef(null);
  const moreActive = OPS_MOBILE_MORE.some((item) =>
    opsNavActive(pathname, item),
  );

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const previouslyFocused = document.activeElement;
    const firstLink = morePanelRef.current?.querySelector("a, button");
    firstLink?.focus?.();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      if (
        previouslyFocused instanceof HTMLElement &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      } else {
        moreButtonRef.current?.focus?.();
      }
    };
  }, [moreOpen]);

  const sheet = (
    <>
      <button
        type="button"
        className={`ops-dock-backdrop ${moreOpen ? "ops-dock-backdrop--open" : ""}`}
        aria-label="Close more menu"
        tabIndex={moreOpen ? 0 : -1}
        onClick={() => setMoreOpen(false)}
      />
      <div
        ref={morePanelRef}
        id={morePanelId}
        className={`ops-dock-sheet ${moreOpen ? "ops-dock-sheet--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="More ops sections"
        aria-hidden={!moreOpen}
        inert={!moreOpen ? true : undefined}
      >
        <div className="ops-dock-sheet__handle" aria-hidden />
        <p className="ops-dock-sheet__title">More</p>
        <nav className="ops-dock-sheet__grid" aria-label="More ops sections">
          {OPS_MOBILE_MORE.map((item) => {
            const active = opsNavActive(pathname, item);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`ops-dock-sheet__link ${
                  active ? "ops-dock-sheet__link--active" : ""
                }`}
              >
                <span className="ops-dock-sheet__icon">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );

  return (
    <>
      <nav className="ops-dock" aria-label="Ops sections">
        <div className="ops-dock__row">
          {OPS_MOBILE_TABS.map((item) => {
            const active = opsNavActive(pathname, item);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`ops-dock__tab ${
                  active ? "ops-dock__tab--active" : ""
                }`}
              >
                <span className="ops-dock__icon">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="ops-dock__label">
                  {item.shortLabel || item.label}
                </span>
              </Link>
            );
          })}
          <button
            ref={moreButtonRef}
            type="button"
            className={`ops-dock__tab ${
              moreOpen || moreActive ? "ops-dock__tab--active" : ""
            }`}
            aria-label="More ops sections"
            aria-expanded={moreOpen}
            aria-controls={morePanelId}
            onClick={() => setMoreOpen((open) => !open)}
          >
            <span className="ops-dock__icon">
              <Ellipsis className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="ops-dock__label">More</span>
          </button>
        </div>
      </nav>

      {portalReady ? createPortal(sheet, document.body) : null}
    </>
  );
}
