"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Debounced location/name suggestions from /api/properties/suggest.
 * Only shows options that exist in the catalog.
 */
export default function LocationSuggestInput({
  value,
  onChange,
  onSelect,
  inputRef,
  placeholder,
  className = "",
  id,
  showIcon = true,
}) {
  const { t, lang } = useLanguage();
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef(null);
  const seqRef = useRef(0);

  useEffect(() => {
    const q = String(value || "").trim();
    if (q.length < 2) {
      setItems([]);
      setLoading(false);
      setOpen(false);
      return undefined;
    }

    const seq = ++seqRef.current;
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort?.();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q,
          lang: lang === "fr" ? "fr" : "en",
        });
        const res = await fetch(`/api/properties/suggest?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (seq !== seqRef.current) return;
        const next = Array.isArray(data.suggestions) ? data.suggestions : [];
        setItems(next);
        setOpen(next.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (seq !== seqRef.current) return;
        setItems([]);
        setOpen(false);
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, lang]);

  useEffect(() => () => abortRef.current?.abort?.(), []);

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (item) => {
    const next = item?.value || item?.label || "";
    onChange(next);
    onSelect?.(item);
    setOpen(false);
    setItems([]);
  };

  const typeLabel = (type) => {
    if (type === "country") return t("search.suggestCountry");
    if (type === "city") return t("search.suggestCity");
    if (type === "property") return t("search.suggestStay");
    return "";
  };

  return (
    <div className="location-suggest" ref={rootRef}>
      {showIcon ? (
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[var(--portal-accent)]"
          aria-hidden
        />
      ) : null}
      <input
        ref={inputRef}
        id={id}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
        }
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (items.length) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % items.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
          } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            choose(items[activeIndex]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        className={className}
      />

      {open && items.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="location-suggest__list"
          aria-label={t("search.suggestions")}
        >
          {items.map((item, index) => {
            const Icon = item.type === "property" ? Building2 : MapPin;
            return (
              <li
                key={`${item.type}-${item.value}-${item.id || index}`}
                role="option"
                id={`${listId}-opt-${index}`}
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  className={`location-suggest__option ${
                    index === activeIndex ? "is-active" : ""
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(item)}
                >
                  <span className="location-suggest__icon" aria-hidden>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="location-suggest__copy">
                    <span className="location-suggest__label">{item.label}</span>
                    {item.subtitle ? (
                      <span className="location-suggest__sub">{item.subtitle}</span>
                    ) : null}
                  </span>
                  <span className="location-suggest__meta">
                    <span className="location-suggest__type">
                      {typeLabel(item.type)}
                    </span>
                    {item.count > 1 ? (
                      <span className="location-suggest__count">{item.count}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {loading && value.trim().length >= 2 && !items.length ? (
        <div className="location-suggest__status" aria-live="polite">
          {t("search.suggestLoading")}
        </div>
      ) : null}
    </div>
  );
}
