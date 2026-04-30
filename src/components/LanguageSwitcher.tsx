"use client";

import { useEffect, useState } from "react";
import i18n, { type Locale } from "@/lib/i18n";

const LOCALE_STORAGE_KEY = "menodao_preferred_language";

interface LanguageSwitcherProps {
  onLocaleChange?: (locale: Locale) => void;
  className?: string;
}

export default function LanguageSwitcher({
  onLocaleChange,
  className = "",
}: LanguageSwitcherProps) {
  const [currentLocale, setCurrentLocale] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "sw") {
      setCurrentLocale(stored);
    }
  }, []);

  const handleChange = async (locale: Locale) => {
    setCurrentLocale(locale);
    await i18n.changeLanguage(locale);
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);

    // Fire-and-forget: persist to backend
    try {
      await fetch("/api/members/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage: locale }),
      });
    } catch (err) {
      console.error(
        "[LanguageSwitcher] Failed to persist language preference:",
        err,
      );
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
