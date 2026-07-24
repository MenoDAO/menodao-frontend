"use client";

import Link from "next/link";
import { I18nextProvider } from "react-i18next";
import i18n, { useTranslation } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function ComplianceContent() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b border-emerald-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2">
            <img src="/logo.png" alt="MenoDAO" className="h-9 w-9" />
            <span className="font-bold text-lg text-gray-900 dark:text-white font-outfit">
              MenoDAO
            </span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-outfit">
          {t("compliance.title")}
        </h1>
        <div className="mt-8 space-y-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          <p>{t("compliance.intro")}</p>
          <p>{t("compliance.kes")}</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {t("compliance.noCrypto")}
          </p>
          <p>{t("compliance.commitment")}</p>
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold underline underline-offset-4"
          >
            {t("compliance.backHome")}
          </Link>
          <Link
            href="/terms"
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium underline underline-offset-4"
          >
            {t("auth.signUp.terms")}
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <I18nextProvider i18n={i18n}>
      <ComplianceContent />
    </I18nextProvider>
  );
}
