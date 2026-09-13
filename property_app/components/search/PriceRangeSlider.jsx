"use client";

import { useCallback, useId } from "react";
import "@/components/search/price-range-slider.css";

/**
 * Thin dual-handle price range slider (USD nightly).
 * Visual track is thin; hit targets are enlarged for a11y/touch.
 */
export default function PriceRangeSlider({
  min = 0,
  max = 1000,
  step = 10,
  valueMin,
  valueMax,
  onChange,
  formatValue = (n) => `$${n}`,
  disabled = false,
}) {
  const id = useId();
  const lo = Math.min(Number(valueMin) || min, Number(valueMax) || max);
  const hi = Math.max(Number(valueMin) || min, Number(valueMax) || max);
  const span = Math.max(max - min, 1);
  const loPct = ((lo - min) / span) * 100;
  const hiPct = ((hi - min) / span) * 100;
  // When handles overlap, raise the max thumb so it stays reachable.
  const hiOnTop = loPct > 50;

  const clamp = useCallback(
    (n) => Math.min(max, Math.max(min, Math.round(n / step) * step)),
    [min, max, step],
  );

  const emit = (nextLo, nextHi) => {
    const a = clamp(nextLo);
    const b = clamp(nextHi);
    onChange?.({ min: Math.min(a, b), max: Math.max(a, b) });
  };

  return (
    <div className="price-range-slider">
      <div className="price-range-slider__labels">
        <span id={`${id}-min-label`}>{formatValue(lo)}</span>
        <span id={`${id}-max-label`}>{formatValue(hi)}</span>
      </div>

      <div
        className="price-range-slider__track"
        aria-disabled={disabled || undefined}
      >
        <div className="price-range-slider__rail" />
        <div
          className="price-range-slider__fill"
          style={{ left: `${loPct}%`, width: `${Math.max(hiPct - loPct, 0)}%` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          disabled={disabled}
          aria-labelledby={`${id}-min-label`}
          aria-valuemin={min}
          aria-valuemax={hi}
          aria-valuenow={lo}
          className="price-range-input price-range-input--lo"
          style={{ zIndex: hiOnTop ? 2 : 3 }}
          onChange={(e) => emit(Number(e.target.value), hi)}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          disabled={disabled}
          aria-labelledby={`${id}-max-label`}
          aria-valuemin={lo}
          aria-valuemax={max}
          aria-valuenow={hi}
          className="price-range-input price-range-input--hi"
          style={{ zIndex: hiOnTop ? 3 : 2 }}
          onChange={(e) => emit(lo, Number(e.target.value))}
        />
      </div>
    </div>
  );
}
