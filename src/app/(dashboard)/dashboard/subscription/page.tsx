"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { Check, Loader2 } from "lucide-react";
import PaymentDialog from "./PaymentDialog";
import DependantManager from "./DependantManager";
import MenoAITeaser from "./MenoAITeaser";

const PACKAGES = [
  {
    tier: "BRONZE" as const,
    price: 350,
    color: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/40",
      text: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500",
      icon: "from-amber-400 to-orange-500",
    },
    features: [
      "1 Dental Checkup/Year",
      "Basic Consultation",
      "Community WhatsApp Access",
    ],
  },
  {
    tier: "SILVER" as const,
    price: 550,
    color: {
      bg: "bg-slate-400/10",
      border: "border-slate-400/40",
      text: "text-slate-500 dark:text-slate-400",
      ring: "ring-slate-400",
      icon: "from-slate-400 to-blue-500",
    },
    features: [
      "2 Checkups/Year",
      "Basic Cleaning",
      "Pain Relief Consultation",
      "Priority Support",
    ],
  },
  {
    tier: "GOLD" as const,
    price: 700,
    color: {
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/40",
      text: "text-yellow-500 dark:text-yellow-400",
      ring: "ring-yellow-400",
      icon: "from-yellow-400 to-amber-500",
    },
    features: [
      "Unlimited Checkups",
      "Full Cleaning & Polishing",
      "Priority Pain Relief",
      "Emergency Filling Coverage",
    ],
  },
];

const tierOrder: Record<"BRONZE" | "SILVER" | "GOLD", number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
};

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [selectedTier, setSelectedTier] = useState<
    "BRONZE" | "SILVER" | "GOLD" | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.getCurrentSubscription(),
  });

  const subscribeMutation = useMutation({
    mutationFn: ({
      tier,
      paymentFrequency,
    }: {
      tier: "BRONZE" | "SILVER" | "GOLD";
      paymentFrequency?: "MONTHLY" | "ANNUAL";
    }) => api.subscribe(tier, paymentFrequency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const handlePaymentComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["contributions"] });
  };

  const handleCardAction = (tier: "BRONZE" | "SILVER" | "GOLD") => {
    setSelectedTier(tier);
    setDialogOpen(true);
  };

  if (subLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            {t("subscription.title")}
          </h1>
          <p className="text-gray-400 mt-2">{t("subscription.subtitle")}</p>
        </div>

        {/* Package Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg, index) => {
            const { tier, price, color, features } = pkg;
            const isCurrentTier =
              subscription?.isActive && subscription.tier === tier;
            const hasActiveSub = subscription?.isActive === true;
            const isHigherTier =
              hasActiveSub && tierOrder[tier] > tierOrder[subscription!.tier];
            const isLowerTier =
              hasActiveSub && tierOrder[tier] < tierOrder[subscription!.tier];
            const isRecommended = tier === "GOLD" && !hasActiveSub;
            // Only disable lower tiers — current tier is always renewable
            const isDisabled = isLowerTier;

            return (
              <div
                key={tier}
                className={`animate-fade-slide-up opacity-0 relative backdrop-blur-md ${color.bg} dark:bg-gray-900/40 border ${color.border} rounded-2xl p-6 ${
                  isDisabled
                    ? ""
                    : "hover:scale-105 hover:shadow-xl transition-all duration-200"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Badge */}
                {isCurrentTier && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${color.icon}`}
                  >
                    {t("subscription.currentPlan")}
                  </div>
                )}
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-yellow-400 to-amber-500">
                    {t("subscription.recommended")}
                  </div>
                )}

                {/* Tier icon */}
                <div className="w-12 h-12 mb-4">
                  {tier === "BRONZE" && (
                    <svg
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-full drop-shadow-lg"
                    >
                      <path
                        d="M24 4L30 16H44L33 25L37 38L24 30L11 38L15 25L4 16H18L24 4Z"
                        fill="url(#bronze-fill)"
                        stroke="#92400e"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <defs>
                        <linearGradient
                          id="bronze-fill"
                          x1="4"
                          y1="4"
                          x2="44"
                          y2="44"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#f59e0b" />
                          <stop offset="0.5" stopColor="#b45309" />
                          <stop offset="1" stopColor="#78350f" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}
                  {tier === "SILVER" && (
                    <svg
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-full drop-shadow-lg"
                    >
                      <path
                        d="M24 4L30 16H44L33 25L37 38L24 30L11 38L15 25L4 16H18L24 4Z"
                        fill="url(#silver-fill)"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <defs>
                        <linearGradient
                          id="silver-fill"
                          x1="4"
                          y1="4"
                          x2="44"
                          y2="44"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#f1f5f9" />
                          <stop offset="0.5" stopColor="#94a3b8" />
                          <stop offset="1" stopColor="#475569" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}
                  {tier === "GOLD" && (
                    <svg
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-full drop-shadow-lg"
                    >
                      <path
                        d="M24 4L30 16H44L33 25L37 38L24 30L11 38L15 25L4 16H18L24 4Z"
                        fill="url(#gold-fill)"
                        stroke="#d97706"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <defs>
                        <linearGradient
                          id="gold-fill"
                          x1="4"
                          y1="4"
                          x2="44"
                          y2="44"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#fef08a" />
                          <stop offset="0.5" stopColor="#eab308" />
                          <stop offset="1" stopColor="#a16207" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}
                </div>

                {/* Tier name & price */}
                <h3 className={`text-lg font-bold ${color.text}`}>{tier}</h3>
                <p className="text-white text-2xl font-bold mt-1">
                  KES {price}
                  <span className="text-gray-400 text-sm font-normal">/mo</span>
                </p>

                {/* Coverage label */}
                <p className="text-gray-400 text-xs mt-2">
                  {t(`subscription.coverage.${tier.toLowerCase()}`)}
                </p>

                {/* Features */}
                <ul className="mt-4 space-y-2">
                  {features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <Check
                        className={`w-4 h-4 ${color.text} shrink-0 mt-0.5`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {/* MenoAI benefit — all tiers */}
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <Check
                      className={`w-4 h-4 ${color.text} shrink-0 mt-0.5`}
                    />
                    <span className="flex items-center gap-1.5">
                      MenoAI WhatsApp Chatbot
                      <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full leading-none">
                        soon
                      </span>
                    </span>
                  </li>
                </ul>

                {/* Action button */}
                <button
                  onClick={() => !isDisabled && handleCardAction(tier)}
                  disabled={isDisabled}
                  className={`mt-6 w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    isLowerTier
                      ? "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5"
                      : isCurrentTier
                        ? `bg-gradient-to-r ${color.icon} text-white hover:opacity-90`
                        : `bg-gradient-to-r ${color.icon} text-white hover:opacity-90`
                  }`}
                >
                  {isLowerTier
                    ? "Not Available"
                    : isCurrentTier
                      ? t("subscription.renew") || "Renew"
                      : isHigherTier
                        ? t("subscription.upgrade")
                        : t("subscription.selectPlan")}
                </button>
              </div>
            );
          })}
        </div>

        {/* Upgrade note for BRONZE */}
        {subscription?.isActive && subscription.tier === "BRONZE" && (
          <p className="text-center text-amber-400 text-sm">
            {t("subscription.upgradeNote")}
          </p>
        )}

        {/* Dependant Manager — only for SILVER/GOLD */}
        {subscription?.isActive && subscription.tier !== "BRONZE" && (
          <DependantManager tier={subscription.tier as "SILVER" | "GOLD"} />
        )}

        {/* MenoAI Teaser */}
        <MenoAITeaser />

        {/* Payment Dialog */}
        {selectedTier && (
          <PaymentDialog
            isOpen={dialogOpen}
            onClose={() => {
              setDialogOpen(false);
              setSelectedTier(null);
            }}
            amount={PACKAGES.find((p) => p.tier === selectedTier)?.price || 0}
            tier={selectedTier}
            onPaymentComplete={handlePaymentComplete}
            isUpgrade={
              subscription?.isActive === true &&
              selectedTier !== subscription?.tier
            }
            isRenewal={
              subscription?.isActive === true &&
              selectedTier === subscription?.tier
            }
            currentTier={subscription?.tier}
            subscriptionEndDate={subscription?.endDate ?? null}
            onSubscribe={async (tier, frequency) => {
              await subscribeMutation.mutateAsync({
                tier,
                paymentFrequency: frequency,
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
