"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Package } from "@/lib/api";
import {
  CreditCard,
  Check,
  Star,
  Crown,
  Shield,
  Loader2,
  ArrowRight,
} from "lucide-react";
import PaymentDialog from "./PaymentDialog";

const tierIcons = {
  BRONZE: Shield,
  SILVER: Star,
  GOLD: Crown,
};

const tierColors = {
  BRONZE: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    button: "bg-amber-600 hover:bg-amber-700",
    gradient: "from-amber-600 to-amber-800",
  },
  SILVER: {
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-700",
    button: "bg-gray-600 hover:bg-gray-700",
    gradient: "from-gray-400 to-gray-600",
  },
  GOLD: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
    button: "bg-yellow-600 hover:bg-yellow-700",
    gradient: "from-yellow-400 to-yellow-600",
  },
};

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<"BRONZE" | "SILVER" | "GOLD" | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: () => api.getPackages(),
  });

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.getCurrentSubscription(),
  });

  const subscribeMutation = useMutation({
    mutationFn: (tier: "BRONZE" | "SILVER" | "GOLD") => api.subscribe(tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSelectedTier(null);
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: (tier: "BRONZE" | "SILVER" | "GOLD") => api.upgrade(tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSelectedTier(null);
    },
  });

  const handleSubscribe = (tier: "BRONZE" | "SILVER" | "GOLD") => {
    if (subscription) {
      upgradeMutation.mutate(tier);
    } else {
      subscribeMutation.mutate(tier);
    }
  };

  const handlePaymentComplete = () => {
    // Refresh subscription and profile data after successful payment
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["contributions"] });
  };

  const tierOrder = { BRONZE: 1, SILVER: 2, GOLD: 3 };
  const currentTierLevel = subscription ? tierOrder[subscription.tier] : 0;

  if (packagesLoading || subLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">My Package</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {subscription
            ? "Manage your membership and make payments"
            : "Choose a package to start your dental care journey"}
        </p>
      </div>

      {/* Current Subscription Card */}
      {subscription && (
        <div className={`rounded-2xl p-6 bg-gradient-to-r ${tierColors[subscription.tier].gradient} text-white shadow-lg`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm">Current Package</p>
              <h2 className="text-2xl font-bold mt-1">{subscription.tier} Membership</h2>
              <p className="text-white/80 mt-2">
                KES {subscription.monthlyAmount}/month
              </p>
              <p className="text-white/60 text-sm mt-1">
                Member since {new Date(subscription.startDate).toLocaleDateString("en-KE")}
              </p>
            </div>
            <CreditCard className="w-12 h-12 text-white/30" />
          </div>

          {/* Benefits */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-white/80 mb-2">Your Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {subscription.benefits?.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-white/80" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pay Button */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <button
              onClick={() => setIsPaymentDialogOpen(true)}
              className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              Pay KES {subscription.monthlyAmount}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Package Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {subscription ? "Upgrade Your Package" : "Choose Your Package"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages?.map((pkg: Package) => {
            const Icon = tierIcons[pkg.tier];
            const colors = tierColors[pkg.tier];
            const isCurrentTier = subscription?.tier === pkg.tier;
            const canUpgrade = tierOrder[pkg.tier] > currentTierLevel;
            const isDisabled = subscription && !canUpgrade;

            return (
              <div
                key={pkg.tier}
                className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
                  isCurrentTier
                    ? `${colors.border} ${colors.bg} dark:bg-gray-800 ring-2 ring-offset-2 ring-${pkg.tier.toLowerCase()}-500`
                    : `border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 ${isDisabled ? "opacity-60" : ""}`
                }`}
              >
                {isCurrentTier && (
                  <div className={`absolute top-0 left-0 right-0 py-1 text-center text-xs font-semibold text-white bg-gradient-to-r ${colors.gradient}`}>
                    CURRENT PLAN
                  </div>
                )}
                {pkg.tier === "GOLD" && !isCurrentTier && (
                  <div className="absolute top-0 left-0 right-0 py-1 text-center text-xs font-semibold text-white bg-gradient-to-r from-yellow-400 to-yellow-600">
                    RECOMMENDED
                  </div>
                )}

                <div className={`p-6 ${isCurrentTier || pkg.tier === "GOLD" ? "pt-10" : ""}`}>
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pkg.tier}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      KES {pkg.monthlyPrice}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">/month</span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {pkg.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Check className={`w-5 h-5 ${colors.text} shrink-0 mt-0.5`} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(pkg.tier)}
                    disabled={isDisabled || subscribeMutation.isPending || upgradeMutation.isPending}
                    className={`mt-6 w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                      isCurrentTier
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : isDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : `${colors.button} text-white`
                    }`}
                  >
                    {subscribeMutation.isPending || upgradeMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isCurrentTier ? (
                      "Current Plan"
                    ) : subscription ? (
                      canUpgrade ? (
                        "Upgrade"
                      ) : (
                        "Lower Tier"
                      )
                    ) : (
                      "Select Package"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Dialog */}
      {subscription && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          amount={subscription.monthlyAmount}
          tier={subscription.tier}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
