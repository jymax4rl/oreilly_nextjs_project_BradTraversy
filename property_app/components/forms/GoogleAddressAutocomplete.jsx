"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { loadGoogleMapsPlaces, parseGooglePlace } from "@/utils/address";

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

export default function GoogleAddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  disabled = false,
  placeholder = "Start typing your address…",
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const hasMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (!hasMapsKey || disabled || !inputRef.current) return;

    let cancelled = false;

    loadGoogleMapsPlaces()
      .then((google) => {
        if (cancelled || !inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            fields: [
              "address_components",
              "formatted_address",
              "geometry",
              "place_id",
            ],
          },
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const parsed = parseGooglePlace(place);
          if (parsed) {
            onPlaceSelect(parsed);
          }
        });

        autocompleteRef.current = autocomplete;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current,
        );
      }
    };
  }, [disabled, hasMapsKey, onPlaceSelect]);

  return (
    <div className="relative">
      <MapPin
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={`${inputClass} pl-10 pr-10`}
      />
      {hasMapsKey && !ready && !loadError ? (
        <Loader2
          className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400"
          aria-hidden
        />
      ) : null}
      {!hasMapsKey || loadError ? (
        <p className="mt-1.5 text-xs text-amber-700">
          Address search unavailable — enter your address manually below.
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-zinc-500">
          Powered by Google — select a suggestion to fill city and country.
        </p>
      )}
    </div>
  );
}
