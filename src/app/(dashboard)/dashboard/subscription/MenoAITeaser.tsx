"use client";
import { useTranslation } from "@/lib/i18n";
import { MessageCircle, Sparkles } from "lucide-react";

export default function MenoAITeaser() {
  const { t } = useTranslation();

  return (
    <div
      className="animate-fade-slide-up opacity-0 backdrop-blur-md bg-emerald-500/10 dark:bg-emerald-900/20 border border-emerald-400/30 rounded-2xl p-6"
      style={{ animationDelay: "300ms" }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {t("subscription.menoai.badge")}
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold text-lg">
            {t("subscription.menoai.title")}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {t("subscription.menoai.description")}
          </p>
          <p className="text-emerald-400/70 text-xs mt-2">
            {t("subscription.menoai.allTiers")}
          </p>
        </div>
        <button
          disabled
          className="flex-shrink-0 bg-emerald-600/30 text-emerald-400 font-medium px-5 py-2.5 rounded-xl text-sm opacity-50 cursor-not-allowed border border-emerald-500/30"
        >
          {t("subscription.menoai.comingSoon")}
        </button>
      </div>
    </div>
  );
}
