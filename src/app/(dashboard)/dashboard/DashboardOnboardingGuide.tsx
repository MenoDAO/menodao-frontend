"use client";

import { useCallback, useEffect } from "react";
import {
  X,
  Shield,
  CreditCard,
  FileText,
  Trophy,
  MapPin,
  Link as LinkIcon,
  User,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export type DashboardOnboardingGuideProps = {
  open: boolean;
  onDismiss: () => void;
};

export default function DashboardOnboardingGuide({
  open,
  onDismiss,
}: DashboardOnboardingGuideProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  if (!open) return null;

  const sections: {
    icon: typeof Shield;
    titleKey: string;
    bodyKey: string;
  }[] = [
    { icon: Shield, titleKey: "onboarding.membershipTitle", bodyKey: "onboarding.membershipBody" },
    { icon: CreditCard, titleKey: "onboarding.packageTitle", bodyKey: "onboarding.packageBody" },
    { icon: FileText, titleKey: "onboarding.claimsTitle", bodyKey: "onboarding.claimsBody" },
    { icon: Trophy, titleKey: "onboarding.championTitle", bodyKey: "onboarding.championBody" },
    { icon: MapPin, titleKey: "onboarding.clinicTitle", bodyKey: "onboarding.clinicBody" },
    { icon: LinkIcon, titleKey: "onboarding.blockchainTitle", bodyKey: "onboarding.blockchainBody" },
    { icon: User, titleKey: "onboarding.profileTitle", bodyKey: "onboarding.profileBody" },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-onboarding-title"
    >
      <div className="w-full sm:max-w-lg max-h-[min(90vh,640px)] sm:rounded-2xl rounded-t-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col animate-slide-up sm:animate-fade-in">
        <div className="shrink-0 flex items-start justify-between gap-3 p-5 pb-0 border-b border-gray-100 dark:border-gray-700/80">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2
                id="dashboard-onboarding-title"
                className="text-lg font-bold text-gray-900 dark:text-white font-outfit leading-tight"
              >
                {t("onboarding.title")}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("onboarding.subtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
            aria-label={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {sections.map(({ icon: Icon, titleKey, bodyKey }) => (
            <div
              key={titleKey}
              className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/80"
            >
              <div className="p-2 h-fit rounded-lg bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-gray-600 shrink-0">
                <Icon className="w-4 h-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t(titleKey)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                  {t(bodyKey)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 p-5 pt-2 border-t border-gray-100 dark:border-gray-700/80">
          <button
            type="button"
            onClick={dismiss}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
          >
            {t("onboarding.gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}
