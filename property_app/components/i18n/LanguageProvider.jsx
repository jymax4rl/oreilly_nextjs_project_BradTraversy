"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { persistLang } from "@/lib/legal/acceptance";
import { LANG_CHOICE_KEY } from "@/lib/legal/constants";
import { lookup } from "@/lib/i18n/lookup";
import { messages } from "@/lib/i18n/messages";
import { resolveRequestLang } from "@/lib/i18n/resolveRequestLang";

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

function hasExplicitChoice() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${LANG_CHOICE_KEY}=1`);
}

function detectClientLang() {
  if (typeof navigator === "undefined") return "en";
  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language].filter(Boolean);
  const acceptLanguage = languages
    .map((tag, i) => `${tag};q=${Math.max(0.1, 1 - i * 0.1).toFixed(1)}`)
    .join(",");
  let timeZone = "";
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    timeZone = "";
  }
  return resolveRequestLang({
    acceptLanguage,
    timeZone,
  }).lang;
}

function persistAccountLanguage(language) {
  if (language !== "en" && language !== "fr") return;
  fetch("/api/user/language", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
  }).catch(() => {});
}

export function LanguageProvider({ initialLang = "en", children }) {
  const { status } = useSession();
  const [lang, setLangState] = useState(initialLang === "fr" ? "fr" : "en");
  const lastSaved = useRef(null);

  const setLang = useCallback((next, { explicit = true } = {}) => {
    const resolved = persistLang(next, { explicit });
    setLangState(resolved);
    if (typeof document !== "undefined") {
      document.documentElement.lang = resolved;
    }
  }, []);

  useEffect(() => {
    if (hasExplicitChoice()) return;
    const match = document.cookie.match(/(?:^|; )kama-lang=(en|fr)(?:;|$)/);
    const cookieLang = match?.[1];
    if (cookieLang) {
      setLangState((prev) => (prev === cookieLang ? prev : cookieLang));
      document.documentElement.lang = cookieLang;
      return;
    }
    setLang(detectClientLang(), { explicit: false });
  }, [setLang]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (lang !== "en" && lang !== "fr") return;
    if (lastSaved.current === lang) return;
    lastSaved.current = lang;
    persistAccountLanguage(lang);
  }, [status, lang]);

  const t = useCallback(
    (key, vars) => {
      return (
        lookup(messages[lang], key, vars) ||
        lookup(messages.en, key, vars) ||
        key
      );
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
