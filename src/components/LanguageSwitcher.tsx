"use client";

import { useEffect, useState } from "react";
import i18n, { type Locale } from "@/lib/i18n";
import { api } from "@/lib/api";

const LOCALE_STORAGE_KEY = "menodao_preferred_language";

interface LanguageSwitcherProps {
  onLocaleChange?: (locale: Locale) => void;
  className?: string;
}

export default function LanguageSwitcher({
  onLocaleChange,
  className = "",
}: LanguageSwitcherProps) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(() =>
    i18n.language === "sw" ? "sw" : "en",
  );

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "sw") {
      setCurrentLocale(stored);
    } else if (i18n.language === "en" || i18n.language === "sw") {
      setCurrentLocale(i18n.language as Locale);
    }
  }, []);

  const handleChange = async (locale: Locale) => {
    setCurrentLocale(locale);
    await i18n.changeLanguage(locale);
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);

    // Persist only when there is an authenticated session (e.g. not on the public landing page)
    if (api.getToken()) {
      try {
        await api.updateProfile({ preferredLanguage: locale });
      } catch (err) {
        console.error(
          "[LanguageSwitcher] Failed to persist language preference:",
          err,
        );
      }
    }

    onLocaleChange?.(locale);
  };

  return (
    <select
      value={currentLocale}
      onChange={(e) => handleChange(e.target.value as Locale)}
      className={`text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 ${className}`}
      aria-label="Select language"
    >
      <option value="en">English</option>
      <option value="sw">Kiswahili</option>
    </select>
  );
}
