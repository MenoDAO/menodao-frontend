"use client";

import { useState } from "react";
import { Check, Clock, Zap, TrendingDown } from "lucide-react";

interface PaymentFrequencySelectorProps {
  tier: "BRONZE" | "SILVER" | "GOLD";
  monthlyPrice: number;
  onSelect: (frequency: "MONTHLY" | "ANNUAL", amount: number) => void;
}

interface PaymentOption {
  frequency: "MONTHLY" | "ANNUAL";
  amount: number;
  totalAnnualCost: number;
  benefits: string[];
  waitingPeriod: string;
  recommended?: boolean;
}

export function PaymentFrequencySelector({
  tier,
  monthlyPrice,
  onSelect,
}: PaymentFrequencySelectorProps) {
  const [selectedFrequency, setSelectedFrequency] = useState<
    "MONTHLY" | "ANNUAL" | null
  >(null);

  const yearlyPrice = monthlyPrice * 12;

  const options: PaymentOption[] = [
    {
      frequency: "MONTHLY",
      amount: monthlyPrice,
      totalAnnualCost: monthlyPrice * 12,
      benefits: ["Pay as you go", "Lower upfront cost", "Flexible commitment"],
      waitingPeriod: "60-90 days",
    },
    {
      frequency: "ANNUAL",
      amount: yearlyPrice,
      totalAnnualCost: yearlyPrice,
      benefits: [
        "Immediate access to all procedures",
        "Only 14-day waiting period",
        "No monthly transaction fees",
        "Better value overall",
      ],
      waitingPeriod: "14 days",
      recommended: true,
    },
  ];

  const handleSelect = (option: PaymentOption) => {
    setSelectedFrequency(option.frequency);
    onSelect(option.frequency, option.amount);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "BRONZE":
        return "from-orange-600 to-orange-800";
      case "SILVER":
        return "from-gray-400 to-gray-600";
      case "GOLD":
        return "from-yellow-500 to-yellow-700";
      default:
        return "from-emerald-600 to-emerald-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Your Payment Plan
        </h2>
        <p className="text-gray-400">
          Select how you'd like to pay for your {tier} subscription
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option) => (
          <div
            key={option.frequency}
            onClick={() => handleSelect(option)}
            className={`relative bg-gray-800 rounded-xl p-6 border-2 transition-all cursor-pointer ${
              selectedFrequency === option.frequency
                ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
                : "border-gray-700 hover:border-gray-600"
            } ${option.recommended ? "ring-2 ring-emerald-500/50" : ""}`}
          >
            {/* Recommended Badge */}
            {option.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  RECOMMENDED
                </div>
              </div>
            )}

            {/* Selected Indicator */}
            {selectedFrequency === option.frequency && (
              <div className="absolute top-4 right-4">
                <div className="bg-emerald-500 rounded-full p-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Frequency Label */}
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {option.frequency === "MONTHLY"
                    ? "Monthly Plan"
                    : "Annual Plan"}
                </h3>
                <p className="text-sm text-gray-400">
                  {option.frequency === "MONTHLY"
                    ? "Pay month by month"
                    : "Pay once for the year"}
                </p>
              </div>

              {/* Price Display */}
              <div className="py-4 border-y border-gray-700">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    KES {option.amount.toLocaleString()}
                  </span>
                  <span className="text-gray-400">
                    {option.frequency === "MONTHLY" ? "/month" : "/year"}
                  </span>
                </div>
                {option.frequency === "ANNUAL" && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-400">
                      Same as {monthlyPrice.toLocaleString()} KES/month
                    </span>
                  </div>
                )}
              </div>

              {/* Waiting Period */}
              <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-white">
                    Waiting Period
                  </span>
                </div>
                <p className="text-sm text-gray-300 ml-6">
                  {option.waitingPeriod}
                  {option.frequency === "MONTHLY" && (
                    <span className="text-gray-400">
                      {" "}
                      (60 days for consultations, 90 days for procedures)
                    </span>
                  )}
                  {option.frequency === "ANNUAL" && (
                    <span className="text-emerald-400">
                      {" "}
                      for all procedures
                    </span>
                  )}
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-2">
                {option.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Total Annual Cost */}
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Annual Cost</span>
                  <span className="text-white font-semibold">
                    KES {option.totalAnnualCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Information */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-400 mb-1">
              About Waiting Periods
            </p>
            <p className="text-sm text-blue-300">
              Waiting periods help ensure the sustainability of the dental fund.
              With the annual plan, you get much faster access to all dental
              procedures - just 14 days compared to 60-90 days with monthly
              payments.
            </p>
          </div>
        </div>
      </div>

      {/* Tier Badge */}
      <div className="flex justify-center">
        <div
          className={`bg-gradient-to-r ${getTierColor(tier)} text-white px-6 py-2 rounded-full font-semibold`}
        >
          {tier} TIER
        </div>
      </div>
    </div>
  );
}
