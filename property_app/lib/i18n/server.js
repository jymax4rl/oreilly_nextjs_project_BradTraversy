import { cookies } from "next/headers";
import { LANG_PREFERENCE_KEY } from "@/lib/legal/constants";
import { lookup } from "@/lib/i18n/lookup";
import { messages } from "@/lib/i18n/messages";

/** @returns {Promise<"en" | "fr">} */
export async function getRequestLang() {
  const store = await cookies();
  return store.get(LANG_PREFERENCE_KEY)?.value === "fr" ? "fr" : "en";
}

export async function getServerT() {
  const lang = await getRequestLang();
  const t = (key, vars) =>
    lookup(messages[lang], key, vars) || lookup(messages.en, key, vars) || key;
  return { lang, t };
}
