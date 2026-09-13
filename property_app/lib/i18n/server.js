import { cookies, headers } from "next/headers";
import {
  LANG_CHOICE_KEY,
  LANG_PREFERENCE_KEY,
} from "@/lib/legal/constants";
import { lookup } from "@/lib/i18n/lookup";
import { messages } from "@/lib/i18n/messages";
import { resolveRequestLang } from "@/lib/i18n/resolveRequestLang";

/** @returns {Promise<"en" | "fr">} */
export async function getRequestLang() {
  const store = await cookies();
  const hdrs = await headers();
  return resolveRequestLang({
    cookieLang: store.get(LANG_PREFERENCE_KEY)?.value,
    explicitChoice: store.get(LANG_CHOICE_KEY)?.value === "1",
    country: hdrs.get("x-vercel-ip-country"),
    acceptLanguage: hdrs.get("accept-language"),
    timeZone: hdrs.get("x-vercel-ip-timezone"),
  }).lang;
}

export async function getServerT() {
  const lang = await getRequestLang();
  const t = (key, vars) =>
    lookup(messages[lang], key, vars) || lookup(messages.en, key, vars) || key;
  return { lang, t };
}
