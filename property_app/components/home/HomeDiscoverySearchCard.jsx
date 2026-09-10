"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  MapPin,
  Search,
  User,
  X,
} from "lucide-react";
import LocationSuggestInput from "@/components/search/LocationSuggestInput";
import DiscoveryDateRangeField from "@/components/home/DiscoveryDateRangeField";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const GUEST_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1);

/**
 * Floating discovery search card — location on top, dates + guests + Search below.
 */
export default function HomeDiscoverySearchCard({
  location,
  onLocationChange,
  inputRef,
  checkIn,
  checkOut,
  onDatesChange,
  guests,
  onGuestsChange,
  onClose,
  onSubmit,
}) {
  const { t } = useLanguage();
  const [guestsOpen, setGuestsOpen] = useState(false);
  const guestsRef = useRef(null);

  useEffect(() => {
    if (!guestsOpen) return undefined;
    const onDoc = (e) => {
      if (guestsRef.current && !guestsRef.current.contains(e.target)) {
        setGuestsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [guestsOpen]);

  const guestLabel =
    Number(guests) === 1
      ? t("search.guestOne")
      : t("search.guestOther").replace("{n}", String(guests || 1));

  return (
    <form
      className="discovery-search-card"
      data-search-shell-widgets
      role="search"
      aria-label={t("search.aria")}
      onSubmit={onSubmit}
    >
      {onClose ? (
        <button
          type="button"
          className="discovery-search-card__dismiss"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}

      <div className="discovery-search-card__where">
        <MapPin className="discovery-search-card__where-icon" aria-hidden />
        <label className="discovery-search-card__where-copy">
          <span className="discovery-search-card__where-label">
            {t("search.whereTo")}
          </span>
          <LocationSuggestInput
            inputRef={inputRef}
            value={location}
            onChange={onLocationChange}
            placeholder={t("search.whereToPh")}
            showIcon={false}
            className="discovery-search-card__where-input"
          />
        </label>
        <button
          type="submit"
          className="discovery-search-card__where-go"
          aria-label={t("search.search")}
        >
          <Search className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <div className="discovery-search-card__meta">
        <DiscoveryDateRangeField
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={onDatesChange}
        />

        <div className="discovery-search-card__field" ref={guestsRef}>
          <button
            type="button"
            className="discovery-search-card__cell"
            aria-expanded={guestsOpen}
            aria-haspopup="listbox"
            onClick={() => setGuestsOpen((o) => !o)}
          >
            <User className="discovery-search-card__cell-icon" aria-hidden />
            <span className="discovery-search-card__cell-copy">
              <span className="discovery-search-card__cell-label">
                {t("search.guests")}
              </span>
              <span className="discovery-search-card__cell-value">
                {guestLabel}
                <ChevronDown
                  className={`discovery-search-card__chevron${
                    guestsOpen ? " is-open" : ""
                  }`}
                  aria-hidden
                />
              </span>
            </span>
          </button>
          {guestsOpen ? (
            <ul
              className="discovery-search-card__guests-menu"
              role="listbox"
              aria-label={t("search.guests")}
            >
              {GUEST_OPTIONS.map((n) => (
                <li key={n} role="option" aria-selected={Number(guests) === n}>
                  <button
                    type="button"
                    className={Number(guests) === n ? "is-active" : undefined}
                    onClick={() => {
                      onGuestsChange?.(n);
                      setGuestsOpen(false);
                    }}
                  >
                    {n === 1
                      ? t("search.guestOne")
                      : t("search.guestOther").replace("{n}", String(n))}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button type="submit" className="discovery-search-card__submit">
          <Search className="h-4 w-4" aria-hidden />
          {t("search.search")}
        </button>
      </div>
    </form>
  );
}
