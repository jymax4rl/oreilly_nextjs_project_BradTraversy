"use client";

import {
  DEFAULT_LANG,
  LANG_CHOICE_KEY,
  LANG_COOKIE_MAX_AGE,
  LANG_PREFERENCE_KEY,
  SUPPORTED_LANGS,
  TERMS_ACCEPTANCE_KEY,
  TERMS_VERSION,
} from "./constants";

function readLangCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LANG_PREFERENCE_KEY}=(en|fr)(?:;|$)`),
  );
  return match ? match[1] : null;
}

function writeLangCookies(lang, explicit) {
  if (typeof document === "undefined") return;
  const base = `Path=/; Max-Age=${LANG_COOKIE_MAX_AGE}; SameSite=Lax`;
  document.cookie = `${LANG_PREFERENCE_KEY}=${lang}; ${base}`;
  if (explicit) {
    document.cookie = `${LANG_CHOICE_KEY}=1; ${base}`;
  }
}

/**
 * @param {string | null | undefined} value
 * @returns {"en" | "fr"}
 */
export function normalizeLang(value) {
  if (value === "fr" || value === "en") return value;
  return DEFAULT_LANG;
}

/**
 * Resolve language: ?lang= → cookie → localStorage → default.
 * @param {string | null | undefined} queryLang
 */
export function resolveLang(queryLang) {
  if (typeof window === "undefined") {
    return normalizeLang(queryLang);
  }
  if (queryLang === "en" || queryLang === "fr") {
    return queryLang;
  }
  const fromCookie = readLangCookie();
  if (fromCookie) return fromCookie;
  try {
    const stored = window.localStorage.getItem(LANG_PREFERENCE_KEY);
    return normalizeLang(stored);
  } catch {
    return DEFAULT_LANG;
  }
}

/**
 * @param {"en" | "fr"} lang
 * @param {{ explicit?: boolean }} [options]
 */
export function persistLang(lang, { explicit = true } = {}) {
  const next = normalizeLang(lang);
  try {
    window.localStorage.setItem(LANG_PREFERENCE_KEY, next);
  } catch {
    /* ignore quota / private mode */
  }
  writeLangCookies(next, explicit);
  return next;
}

/**
 * @returns {{ version: string, acceptedAt: string } | null}
 */
export function readTermsAcceptance() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TERMS_ACCEPTANCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.version !== "string") return null;
    return {
      version: parsed.version,
      acceptedAt:
        typeof parsed.acceptedAt === "string"
          ? parsed.acceptedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** @returns {boolean} */
export function hasAcceptedCurrentTerms() {
  const record = readTermsAcceptance();
  return !!record && record.version === TERMS_VERSION;
}

export function persistTermsAcceptance(version = TERMS_VERSION) {
  const payload = {
    version,
    acceptedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(TERMS_ACCEPTANCE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  return payload;
}

export { TERMS_VERSION, SUPPORTED_LANGS, DEFAULT_LANG };
