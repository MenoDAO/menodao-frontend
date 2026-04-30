import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import sw from "../locales/sw.json";

export type Locale = "en" | "sw";

const LOCALE_STORAGE_KEY = "menodao_preferred_language";

/**
 * Determines the active locale using the following priority:
 * 1. localStorage key 'menodao_preferred_language'
 * 2. Provided backendLocale (from member profile)
 * 3. navigator.language (sw* → 'sw', otherwise 'en')
 * 4. Default: 'en'
 */
export function detectLocale(
  backendLocale?: string | null,
  navigatorLanguage?: string,
): Locale {
  // Guard against SSR context
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "sw" || stored === "en") return stored;
  }

  if (backendLocale === "sw" || backendLocale === "en") return backendLocale;

  const nav =
    navigatorLanguage ??
    (typeof navigator !== "undefined" ? navigator.language : "");
  if (nav.startsWith("sw")) return "sw";

  return "en";
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      sw: { translation: sw },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    saveMissing: true,
    missingKeyHandler: (_lngs, _ns, key) => {
      console.warn(`[i18n] Missing key: ${key} for locale: ${i18n.language}`);
    },
  });
}

export default i18n;
export { useTranslation } from "react-i18next";
