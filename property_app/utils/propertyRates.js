import { enumerateStayNights } from "@/utils/availability/dateUtils";
import { customDayRatesToMap } from "@/utils/availability/customDayRates";

/**
 * Property rates are stored in USD on the listing (rates.nightly | weekly | monthly).
 * Guest UI converts via CurrencyContext at display time.
 */

export function parseRate(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

/** @returns {{ nightly: number|null, weekly: number|null, monthly: number|null }} */
export function normalizeRates(rates) {
  if (!rates || typeof rates !== "object") {
    return { nightly: null, weekly: null, monthly: null };
  }
  return {
    nightly: parseRate(rates.nightly),
    weekly: parseRate(rates.weekly),
    monthly: parseRate(rates.monthly),
  };
}

export function hasAnyRate(rates) {
  const r = normalizeRates(rates);
  return Boolean(r.nightly || r.weekly || r.monthly);
}

export function parseRatesFromFormData(formData) {
  return normalizeRates({
    nightly: formData.get("rates.nightly"),
    weekly: formData.get("rates.weekly"),
    monthly: formData.get("rates.monthly"),
  });
}

export function parseRatesFromBody(body) {
  return normalizeRates({
    nightly: body?.nightly,
    weekly: body?.weekly,
    monthly: body?.monthly,
  });
}

/** Primary label for cards when no dates selected */
export function getPrimaryDisplayRate(rates) {
  const r = normalizeRates(rates);
  if (r.nightly) {
    return { amount: r.nightly, suffix: "/ night", basis: "nightly" };
  }
  if (r.weekly) {
    return { amount: r.weekly, suffix: "/ week", basis: "weekly" };
  }
  if (r.monthly) {
    return { amount: r.monthly, suffix: "/ month", basis: "monthly" };
  }
  return null;
}

/**
 * Booking base from stay length (USD).
 * @param {object} rates
 * @param {number} nights count of nights (checkOut exclusive)
 */
/** Default per-night USD when no day override applies. */
export function getDefaultNightlyUsd(rates) {
  const r = normalizeRates(rates);
  if (r.nightly) return r.nightly;
  if (r.weekly) return Math.round((r.weekly / 7) * 100) / 100;
  if (r.monthly) return Math.round((r.monthly / 30) * 100) / 100;
  return null;
}

/**
 * Sum each stay night; use customDayRates when set, else default nightly.
 * Falls back to calculateBookingBase when no per-night defaults exist.
 */
export function calculateStayTotal(rates, customDayRates, checkIn, checkOut) {
  const nights = enumerateStayNights(checkIn, checkOut);
  if (nights.length === 0) return null;

  const overrideMap = customDayRatesToMap(customDayRates);
  const defaultNight = getDefaultNightlyUsd(rates);
  const hasOverrides = nights.some((d) => overrideMap.has(d));

  if (!defaultNight && !hasOverrides && !hasAnyRate(rates)) {
    return null;
  }

  if (!hasOverrides && defaultNight) {
    return {
      base: Math.round(defaultNight * nights.length * 100) / 100,
      basis: "nightly",
      label: `${nights.length} night${nights.length !== 1 ? "s" : ""}`,
      customNights: 0,
    };
  }

  if (!hasOverrides) {
    return calculateBookingBase(rates, nights.length);
  }

  let total = 0;
  let customNights = 0;

  for (const date of nights) {
    const custom = overrideMap.get(date);
    if (custom != null) {
      total += custom;
      customNights += 1;
    } else if (defaultNight != null) {
      total += defaultNight;
    } else {
      return calculateBookingBase(rates, nights.length);
    }
  }

  return {
    base: Math.round(total * 100) / 100,
    basis: customNights === nights.length ? "custom" : "mixed",
    label:
      customNights > 0
        ? `${nights.length} night${nights.length !== 1 ? "s" : ""} (${customNights} custom)`
        : `${nights.length} night${nights.length !== 1 ? "s" : ""}`,
    customNights,
  };
}

export function calculateBookingBase(rates, nights) {
  const r = normalizeRates(rates);
  if (!nights || nights < 1) return null;

  if (r.nightly) {
    return {
      base: Math.round(r.nightly * nights * 100) / 100,
      basis: "nightly",
      label: `${nights} night${nights !== 1 ? "s" : ""}`,
    };
  }

  if (nights >= 28 && r.monthly) {
    return {
      base: Math.round((r.monthly / 30) * nights * 100) / 100,
      basis: "monthly",
      label: `${nights} nights (monthly rate)`,
    };
  }

  if (nights >= 7 && r.weekly) {
    return {
      base: Math.round((r.weekly / 7) * nights * 100) / 100,
      basis: "weekly",
      label: `${nights} nights (weekly rate)`,
    };
  }

  if (r.weekly) {
    return {
      base: r.weekly,
      basis: "weekly",
      label: "1 week minimum",
    };
  }

  if (r.monthly) {
    return {
      base: r.monthly,
      basis: "monthly",
      label: "1 month minimum",
    };
  }

  return null;
}

/** Guest checkout fees (percent of accommodation base, USD). */
export const CLEANING_FEE_RATE = 0.15;
export const PLATFORM_COMMISSION_RATE = 0.07;

export function calculateBookingFees(baseUsd) {
  const base = Math.max(0, Math.round((baseUsd || 0) * 100) / 100);
  const cleaningFee = Math.round(base * CLEANING_FEE_RATE * 100) / 100;
  const commission = Math.round(base * PLATFORM_COMMISSION_RATE * 100) / 100;
  const total = Math.round((base + cleaningFee + commission) * 100) / 100;
  return { base, cleaningFee, commission, total };
}

export function validateRatesPayload(rates) {
  const normalized = normalizeRates(rates);
  if (!hasAnyRate(normalized)) {
    return {
      ok: false,
      error: "Set at least one rate (nightly, weekly, or monthly).",
      rates: normalized,
    };
  }
  return { ok: true, rates: normalized };
}
