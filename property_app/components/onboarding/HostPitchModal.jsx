"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { HOST_PITCH_SLIDES } from "@/components/onboarding/hostPitchSlides";
import { useLanguage } from "@/components/i18n/LanguageProvider";

gsap.registerPlugin(useGSAP);

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function focusablesIn(root) {
  if (!root) return [];
  return [
    ...root.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ];
}

/**
 * Host-application pitch. Same dialog language as GuestPhoneModal
 * (overlay, teal CTAs, Escape, scroll lock) — sized for a short carousel.
 */
export default function HostPitchModal({
  open,
  signedIn,
  finishLabel,
  onDismiss,
  onFinish,
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const rootRef = useRef(null);
  const visualRef = useRef(null);
  const copyRef = useRef(null);
  const primaryRef = useRef(null);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  const slides = HOST_PITCH_SLIDES;
  const slide = slides[index];
  const isLast = index === slides.length - 1;
  const progress = ((index + 1) / slides.length) * 100;

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss?.();
        return;
      }
      if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(i + 1, slides.length - 1));
      }
      if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Tab" && rootRef.current) {
        const nodes = focusablesIn(rootRef.current);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => primaryRef.current?.focus(), 40);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onDismiss, slides.length]);

  useGSAP(
    () => {
      if (!open || !rootRef.current) return;
      const reduced = prefersReducedMotion();
      gsap.fromTo(
        rootRef.current,
        { opacity: 0, y: reduced ? 0 : 16, scale: reduced ? 1 : 0.988 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: reduced ? 0.12 : 0.38,
          ease: "power3.out",
        },
      );
    },
    { dependencies: [open] },
  );

  useGSAP(
    () => {
      if (!open) return;
      const reduced = prefersReducedMotion();
      const copyEls = copyRef.current?.querySelectorAll("[data-copy]");
      gsap.fromTo(
        visualRef.current,
        { opacity: 0, y: reduced ? 0 : 10 },
        { opacity: 1, y: 0, duration: reduced ? 0.1 : 0.36, ease: "power2.out" },
      );
      if (copyEls?.length) {
        gsap.fromTo(
          copyEls,
          { opacity: 0, y: reduced ? 0 : 8 },
          {
            opacity: 1,
            y: 0,
            duration: reduced ? 0.1 : 0.32,
            stagger: reduced ? 0 : 0.045,
            delay: reduced ? 0 : 0.05,
            ease: "power2.out",
          },
        );
      }
      if (!reduced && visualRef.current) {
        gsap.to(visualRef.current, {
          y: 5,
          duration: 3.2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      }
    },
    { dependencies: [index, open] },
  );

  if (!open || !slide) return null;

  const goNext = () => {
    if (isLast) {
      onFinish?.();
      return;
    }
    setIndex((i) => i + 1);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const delta = start - end;
    if (delta > 48 && !isLast) setIndex((i) => i + 1);
    else if (delta < -48) setIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label={t("hostPitch.skipIntro")}
        onClick={() => onDismiss?.()}
      />

      <div
        ref={rootRef}
        className="relative z-10 flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-2xl sm:rounded-2xl lg:max-h-[min(86dvh,580px)] lg:flex-row"
      >
        <button
          type="button"
          onClick={() => onDismiss?.()}
          className="absolute right-3 top-3 z-20 rounded-full bg-[var(--kama-surface)]/92 p-2 text-[var(--kama-ink-muted)] shadow-sm transition hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)] lg:bg-transparent lg:shadow-none"
          aria-label={t("hostPitch.close")}
        >
          <X size={18} aria-hidden />
        </button>

        <div className="flex h-[22svh] w-full shrink-0 items-center justify-center bg-[var(--kama-canvas-soft)] sm:h-[28svh] lg:h-auto lg:w-[38%]">
          <div
            ref={visualRef}
            key={slide.id}
            className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-2xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)] sm:h-28 sm:w-28"
            aria-hidden
          >
            <slide.Icon
              className="h-11 w-11 sm:h-14 sm:w-14"
              strokeWidth={1.6}
            />
          </div>
          <span className="sr-only">{t(`hostPitch.${slide.id}.iconLabel`)}</span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-[var(--kama-surface)] px-5 py-5 sm:px-8 sm:py-7">
          <div ref={copyRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
            <p
              data-copy
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--kama-accent)]"
            >
              {t(`hostPitch.${slide.id}.eyebrow`)}
            </p>
            <h2
              id={titleId}
              data-copy
              className="mt-2 text-[1.4rem] font-semibold leading-[1.2] tracking-tight text-[var(--kama-ink)] sm:text-[1.75rem]"
            >
              {t(`hostPitch.${slide.id}.title`)}
            </h2>
            <p
              data-copy
              className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--kama-ink-muted)] sm:text-base"
            >
              {t(`hostPitch.${slide.id}.body`)}
            </p>
          </div>

          <div className="mt-6 shrink-0">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="h-0.5 flex-1 overflow-hidden rounded-full bg-[var(--kama-accent-soft)]"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-[var(--kama-accent)] transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex gap-1.5" role="tablist" aria-label={t("hostPitch.slides")}>
                {slides.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={t("hostPitch.slideN", {
                      n: i + 1,
                      title: t(`hostPitch.${item.id}.title`),
                    })}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index
                        ? "w-5 bg-[var(--kama-accent)]"
                        : "w-1.5 bg-[var(--kama-border-strong)] hover:bg-[var(--kama-accent)]/50"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {index > 0 ? (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i - 1)}
                  className="h-12 rounded-xl border border-[var(--kama-border)] px-4 text-sm font-medium text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)]"
                >
                  {t("hostPitch.back")}
                </button>
              ) : null}
              <button
                ref={primaryRef}
                type="button"
                onClick={goNext}
                className="kama-cta h-12 flex-1 rounded-xl text-sm font-semibold"
              >
                {isLast
                  ? finishLabel ||
                    (signedIn ? t("host.startApp") : t("host.logInApply"))
                  : t("hostPitch.continue")}
              </button>
            </div>
            <button
              type="button"
              onClick={() => onDismiss?.()}
              className="mt-3 w-full text-center text-[13px] font-medium text-[var(--kama-ink-muted)] transition hover:text-[var(--kama-ink)] hover:underline"
            >
              {t("hostPitch.skip")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
