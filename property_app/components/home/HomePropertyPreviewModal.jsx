"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Bed,
  Bath,
  Users,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
} from "lucide-react";
import { formatListingPrice } from "@/utils/currencyUtils";
import { useCurrency } from "@/utils/CurrencyContext";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { propertyImageUrl } from "@/utils/propertyImageUrl";
import {
  captureFlipState,
  fadeInUi,
  fadeOutUi,
  prefersReducedMotion,
  runFlipFrom,
} from "@/utils/animations/flipUi";

function focusablesIn(root) {
  if (!root) return [];
  return [
    ...root.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ];
}

/**
 * Homepage property preview — Flip from card media into a modal with
 * gallery, capacity, amenities, then Reserve → full listing page.
 */
export default function HomePropertyPreviewModal({
  propertyId,
  seed = null,
  flipState = null,
  onClose,
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const { currencyCode, rates } = useCurrency();
  const titleId = useId();
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const heroRef = useRef(null);
  const bodyRef = useRef(null);
  const closeRef = useRef(null);
  const animCleanup = useRef(null);
  const touchX = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(seed);
  const [index, setIndex] = useState(0);
  const [entered, setEntered] = useState(false);

  const open = Boolean(propertyId);

  useEffect(() => {
    if (!propertyId) return undefined;
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setIndex(0);

    (async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/preview`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data.ok || !data.property) {
          throw new Error(data.error || "Unable to load stay");
        }
        setDetail(data.property);
      } catch (err) {
        if (err?.name === "AbortError" || cancelled) return;
        setError(err.message || "Unable to load stay");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [propertyId]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        void handleClose();
        return;
      }
      if (e.key === "ArrowRight") {
        setIndex((i) => {
          const len = detail?.images?.length || 1;
          return (i + 1) % len;
        });
      }
      if (e.key === "ArrowLeft") {
        setIndex((i) => {
          const len = detail?.images?.length || 1;
          return (i - 1 + len) % len;
        });
      }
      if (e.key === "Tab" && panelRef.current) {
        const nodes = focusablesIn(panelRef.current);
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
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, detail?.images?.length]);

  useLayoutEffect(() => {
    if (!open || !heroRef.current) return undefined;
    animCleanup.current?.();
    animCleanup.current = runFlipFrom({
      flipState,
      duration: 0.55,
      absolute: true,
      onComplete: () => {
        setEntered(true);
        fadeInUi([bodyRef.current, closeRef.current], { delay: 0.05 });
        closeRef.current?.focus?.();
      },
    });
    if (!flipState || prefersReducedMotion()) {
      setEntered(true);
      fadeInUi([bodyRef.current, closeRef.current], { delay: 0 });
      closeRef.current?.focus?.();
    }
    return () => animCleanup.current?.();
  }, [open, flipState]);

  const handleClose = useCallback(async () => {
    await fadeOutUi([bodyRef.current, panelRef.current]);
    onClose?.();
  }, [onClose]);

  const images = (detail?.images?.length ? detail.images : seed?.images || [])
    .map((entry) => (typeof entry === "string" ? entry : propertyImageUrl(entry)))
    .filter(Boolean);
  const activeImage = images[index] || images[0] || "/properties/a1.jpg";
  const display = detail || seed;
  const price =
    display?.listingPrice != null
      ? formatListingPrice(display.listingPrice, rates, currencyCode)
      : null;

  const goReserve = () => {
    const href = detail?.href;
    if (!href) return;
    router.push(href);
  };

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className="home-prop-preview"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="home-prop-preview__backdrop"
        aria-label={t("preview.close")}
        onClick={() => void handleClose()}
      />

      <div ref={panelRef} className="home-prop-preview__panel" data-home-prop-preview-panel>
        <button
          ref={closeRef}
          type="button"
          className="home-prop-preview__close"
          aria-label={t("preview.close")}
          onClick={() => void handleClose()}
        >
          <X className="h-4 w-4" />
        </button>

        <div
          ref={heroRef}
          className="home-prop-preview__hero"
          data-home-prop-flip
          data-flip-id={propertyId ? `home-prop-${propertyId}` : undefined}
          onTouchStart={(e) => {
            touchX.current = e.changedTouches?.[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches?.[0]?.clientX;
            touchX.current = null;
            if (start == null || end == null || images.length < 2) return;
            const delta = end - start;
            if (Math.abs(delta) < 40) return;
            setIndex((i) =>
              delta < 0
                ? (i + 1) % images.length
                : (i - 1 + images.length) % images.length,
            );
          }}
        >
          <Image
            src={activeImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 34rem"
            className="object-cover"
            priority
          />
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="home-prop-preview__nav home-prop-preview__nav--prev"
                aria-label="Previous photo"
                onClick={() =>
                  setIndex((i) => (i - 1 + images.length) % images.length)
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="home-prop-preview__nav home-prop-preview__nav--next"
                aria-label="Next photo"
                onClick={() => setIndex((i) => (i + 1) % images.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="home-prop-preview__dots" aria-hidden>
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`home-prop-preview__dot ${i === index ? "is-active" : ""}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div
          ref={bodyRef}
          className={`home-prop-preview__body ${entered ? "is-ready" : ""}`}
        >
          {loading && !display ? (
            <p className="home-prop-preview__status">{t("search.suggestLoading")}</p>
          ) : null}
          {error ? (
            <p className="home-prop-preview__status home-prop-preview__status--error">
              {error}
            </p>
          ) : null}

          {display ? (
            <>
              <div className="home-prop-preview__topline">
                <p className="home-prop-preview__type">{display.type}</p>
                {price ? (
                  <p className="home-prop-preview__price">
                    {price}
                    <span>{t("listing.perNight")}</span>
                  </p>
                ) : null}
              </div>

              <h2 id={titleId} className="home-prop-preview__title">
                {display.name}
              </h2>

              <p className="home-prop-preview__place">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {[display.city, display.country].filter(Boolean).join(", ")}
              </p>

              <div className="home-prop-preview__stats">
                {display.beds != null ? (
                  <span>
                    <Bed className="h-3.5 w-3.5" aria-hidden />
                    {display.beds} {t("listing.beds")}
                  </span>
                ) : null}
                {display.baths != null ? (
                  <span>
                    <Bath className="h-3.5 w-3.5" aria-hidden />
                    {display.baths} {t("listing.baths")}
                  </span>
                ) : null}
                {display.maxGuests != null ? (
                  <span>
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {display.maxGuests} {t("listing.guests")}
                  </span>
                ) : null}
              </div>

              {display.description ? (
                <p className="home-prop-preview__desc">{display.description}</p>
              ) : null}

              {display.amenities?.length ? (
                <div className="home-prop-preview__amenities">
                  <p className="home-prop-preview__amenities-label">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    {t("preview.amenities")}
                  </p>
                  <ul>
                    {display.amenities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="home-prop-preview__actions">
                <button
                  type="button"
                  className="home-prop-preview__secondary"
                  onClick={() => void handleClose()}
                >
                  {t("preview.keepBrowsing")}
                </button>
                <button
                  type="button"
                  className="home-prop-preview__reserve"
                  onClick={goReserve}
                  disabled={!detail?.href}
                >
                  {t("preview.reserve")}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Helper for parents: capture card media Flip state before opening. */
export function captureCardFlipState(cardEl) {
  const media =
    cardEl?.querySelector?.("[data-home-prop-flip]") ||
    cardEl?.querySelector?.("img")?.parentElement ||
    cardEl;
  return captureFlipState(media);
}
