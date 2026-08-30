"use client";

import { useCurrency } from "@/utils/CurrencyContext";
import { CURRENCIES } from "@/utils/currencyUtils";

/**
 * Display currency preference — same store as Navbar Currency pill (localStorage).
 * Not synced to Mongo yet; persists per browser.
 */
export default function CurrencyPreference() {
  const { currencyCode, setCurrencyCode, loading } = useCurrency();

  return (
    <div>
      <label
        htmlFor="settings-currency"
        className="block text-sm font-medium text-[var(--kama-ink)]"
      >
        Display currency
      </label>
      <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
        Used for prices across the site. Stored on this device.
      </p>
      <select
        id="settings-currency"
        value={currencyCode}
        disabled={loading}
        onChange={(e) => setCurrencyCode(e.target.value)}
        className="mt-3 w-full max-w-xs rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3 py-2.5 text-sm font-medium text-[var(--kama-ink)] outline-none focus:border-[var(--kama-accent)] focus:ring-2 focus:ring-[var(--kama-accent)]/15"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} — {c.name.trim()} ({c.symbol})
          </option>
        ))}
      </select>
    </div>
  );
}
