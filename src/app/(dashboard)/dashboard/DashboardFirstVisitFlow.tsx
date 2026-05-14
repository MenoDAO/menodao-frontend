"use client";

import { useCallback, useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import i18n, { detectLocale, type Locale } from "@/lib/i18n";
import {
  dashboardLanguageConfirmKey,
  dashboardOnboardingKey,
} from "./dashboard-first-visit-keys";
import DashboardOnboardingGuide from "./DashboardOnboardingGuide";

type Step = "idle" | "language" | "onboarding";

export default function DashboardFirstVisitFlow() {
  const member = useAuthStore((s) => s.member);
  const updateMember = useAuthStore((s) => s.updateMember);
  const [step, setStep] = useState<Step>("idle");

  useEffect(() => {
    if (!member?.id || typeof window === "undefined") {
      setStep("idle");
      return;
    }
    try {
      const langKey = dashboardLanguageConfirmKey(member.id);
      const obKey = dashboardOnboardingKey(member.id);
      let langDone = localStorage.getItem(langKey);
      const onboardDone = localStorage.getItem(obKey);
      // Users who completed onboarding before the language step existed should not see language again.
      if (onboardDone && !langDone) {
        localStorage.setItem(langKey, "1");
        langDone = "1";
      }
      if (!langDone) {
        const t = window.setTimeout(() => setStep("language"), 200);
        return () => window.clearTimeout(t);
      }
      if (!onboardDone) {
        const t = window.setTimeout(() => setStep("onboarding"), 200);
        return () => window.clearTimeout(t);
      }
      setStep("idle");
    } catch {
      setStep("idle");
    }
  }, [member?.id]);

  useEffect(() => {
    if (step !== "language") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [step]);

  const applyLanguage = useCallback(
    async (locale: Locale) => {
      i18n.changeLanguage(locale);
      try {
        localStorage.setItem("menodao_preferred_language", locale);
      } catch {
        /* ignore */
      }
      if (member?.id) {
        try {
          localStorage.setItem(dashboardLanguageConfirmKey(member.id), "1");
        } catch {
          /* ignore */
        }
      }
      try {
        await api.updateProfile({ preferredLanguage: locale });
      } catch {
        /* offline / non-fatal */
      }
      if (member) {
        updateMember({ ...member, preferredLanguage: locale });
      }
      setStep("onboarding");
    },
    [member, updateMember],
  );

  const dismissOnboarding = useCallback(() => {
    if (member?.id) {
      try {
        localStorage.setItem(dashboardOnboardingKey(member.id), "1");
      } catch {
        /* ignore */
      }
    }
    setStep("idle");
  }, [member?.id]);

  if (!member?.id) return null;

  const suggested = detectLocale(member?.preferredLanguage);

  return (
    <>
      {step === "language" && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="first-visit-lang-title"
        >
          <div className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 animate-slide-up sm:animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                <Languages className="w-8 h-8" aria-hidden />
              </div>
            </div>
            <h2
              id="first-visit-lang-title"
              className="text-center text-xl font-bold text-gray-900 dark:text-white font-outfit"
            >
              Choose your language
            </h2>
            <p className="text-center text-base text-gray-700 dark:text-gray-300 mt-1 font-medium">
              Chagua lugha yako
            </p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
              The quick tour right after this will use the language you pick. You can change it
              anytime in Profile or the footer.
            </p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              Mwongozo mfupi utafuata utatumia lugha unayochagua. Unaweza kubadilisha wakati wowote
              kwenye Wasifu au sehemu ya chini.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
              <button
                type="button"
                onClick={() => void applyLanguage("en")}
                className={`py-4 px-4 rounded-xl border-2 font-semibold text-gray-900 dark:text-white transition-all hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${
                  suggested === "en"
                    ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/30"
                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => void applyLanguage("sw")}
                className={`py-4 px-4 rounded-xl border-2 font-semibold text-gray-900 dark:text-white transition-all hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${
                  suggested === "sw"
                    ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/30"
                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                }`}
              >
                Kiswahili
              </button>
            </div>
          </div>
        </div>
      )}

      <DashboardOnboardingGuide open={step === "onboarding"} onDismiss={dismissOnboarding} />
    </>
  );
}
