"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { parseGooglePlace } from "@/utils/address";
import {
  hasGoogleMapsApiKey,
  loadGoogleMapsApi,
  GOOGLE_MAPS_LOAD_TIMEOUT_MS,
} from "@/utils/googleMaps";

const inputClass =
  "h-12 w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 text-[15px] text-[var(--kama-ink)] outline-none transition placeholder:text-[var(--kama-ink-muted)] focus:border-[var(--kama-accent)] focus:ring-2 focus:ring-[var(--kama-accent)]/15";

/**
 * Address search via Places API (New) AutocompleteSuggestion.
 * Does NOT use legacy google.maps.places.Autocomplete (LegacyApiNotActivatedMapError).
 */
export default function GoogleAddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  disabled = false,
  placeholder = "Start typing your address…",
}) {
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const hasMapsKey = hasGoogleMapsApiKey();

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  useEffect(() => {
    if (!hasMapsKey || disabled) return;

    let cancelled = false;
    const safetyTimer = window.setTimeout(() => {
      if (!cancelled) setLoadError(true);
    }, GOOGLE_MAPS_LOAD_TIMEOUT_MS + 1_500);

    loadGoogleMapsApi(["places"])
      .then(async (google) => {
        if (cancelled) return;
        const placesLib =
          google.maps.places ||
          (await google.maps.importLibrary("places").catch(() => null));
        const AutocompleteSuggestion = placesLib?.AutocompleteSuggestion;
        const AutocompleteSessionToken = placesLib?.AutocompleteSessionToken;
        // Guard: never fall back to legacy Autocomplete — that throws LegacyApiNotActivatedMapError.
        if (!AutocompleteSuggestion || !AutocompleteSessionToken) {
          setLoadError(true);
          return;
        }
        sessionTokenRef.current = new AutocompleteSessionToken();
        window.clearTimeout(safetyTimer);
        setReady(true);
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) {
          window.clearTimeout(safetyTimer);
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [disabled, hasMapsKey]);

  const fetchSuggestions = useCallback(async (input) => {
    const query = String(input || "").trim();
    if (query.length < 3 || !window.google?.maps) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const reqId = ++requestIdRef.current;
    setFetching(true);
    try {
      const placesLib =
        window.google.maps.places ||
        (await window.google.maps.importLibrary("places"));
      const AutocompleteSuggestion = placesLib?.AutocompleteSuggestion;
      const AutocompleteSessionToken = placesLib?.AutocompleteSessionToken;
      if (!AutocompleteSuggestion) {
        setLoadError(true);
        setSuggestions([]);
        return;
      }
      if (!sessionTokenRef.current && AutocompleteSessionToken) {
        sessionTokenRef.current = new AutocompleteSessionToken();
      }

      const { suggestions: next } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          sessionToken: sessionTokenRef.current || undefined,
          includedPrimaryTypes: [
            "street_address",
            "premise",
            "subpremise",
            "route",
          ],
        });

      if (reqId !== requestIdRef.current) return;
      const list = Array.isArray(next) ? next : [];
      setSuggestions(list);
      setOpen(list.length > 0);
    } catch {
      // Places API (New) missing / denied — soft-fail to manual fields; no console spam.
      if (reqId === requestIdRef.current) {
        setSuggestions([]);
        setOpen(false);
        setLoadError(true);
      }
    } finally {
      if (reqId === requestIdRef.current) setFetching(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const next = e.target.value;
    onChange(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!ready || loadError) return;
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(next);
    }, 280);
  };

  const handleSelect = async (suggestion) => {
    const prediction = suggestion?.placePrediction;
    if (!prediction) return;

    setOpen(false);
    setSuggestions([]);
    setFetching(true);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: [
          "id",
          "displayName",
          "formattedAddress",
          "location",
          "addressComponents",
        ],
      });
      const parsed = parseGooglePlace(place);
      if (parsed) {
        onPlaceSelectRef.current?.(parsed);
        // Refresh session token after a completed Place Details fetch.
        const Token = window.google?.maps?.places?.AutocompleteSessionToken;
        if (Token) sessionTokenRef.current = new Token();
      }
    } catch {
      setLoadError(true);
    } finally {
      setFetching(false);
    }
  };

  const predictionLabel = (suggestion) => {
    const text = suggestion?.placePrediction?.text;
    if (!text) return "";
    if (typeof text.toString === "function") return text.toString();
    return text.text || String(text);
  };

  return (
    <div className="relative">
      <MapPin
        className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-[var(--kama-ink-muted)]"
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          // Delay so suggestion click registers.
          window.setTimeout(() => setOpen(false), 180);
        }}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-label="Search address"
        className={`${inputClass} pl-10 pr-10`}
      />
      {(hasMapsKey && !ready && !loadError) || fetching ? (
        <Loader2
          className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--kama-ink-muted)]"
          aria-hidden
        />
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] py-1 shadow-lg"
        >
          {suggestions.map((suggestion, i) => {
            const label = predictionLabel(suggestion);
            const key =
              suggestion?.placePrediction?.placeId ||
              suggestion?.placePrediction?.toPlace?.()?.id ||
              `${label}-${i}`;
            return (
              <li key={key} role="option">
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(suggestion)}
                >
                  <MapPin
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--kama-accent)]"
                    aria-hidden
                  />
                  <span className="min-w-0 break-words">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {!hasMapsKey || loadError ? (
        <p className="mt-1.5 text-xs text-amber-800/90" role="status">
          Address search unavailable — enter your address manually below. You
          can still continue once street, city, and country are filled. Enable{" "}
          <strong>Places API (New)</strong> and{" "}
          <strong>Maps JavaScript API</strong> in Google Cloud if you want
          suggestions.
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-[var(--kama-ink-muted)]">
          Select a suggestion to fill street, city, country, and map pin.
        </p>
      )}
    </div>
  );
}
