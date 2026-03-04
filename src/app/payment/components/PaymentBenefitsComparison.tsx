"use client";

import { Clock, DollarSign, Zap, Calendar, Check, X, Info } from "lucide-react";
import { useState } from "react";

interface PaymentBenefitsComparisonProps {
  monthlyPrice: number;
}

interface ComparisonRow {
  feature: string;
  monthly: string | boolean;
  annual: string | boolean;
  icon: React.ReactNode;
  tooltip?: string;
}

export function PaymentBenefitsComparison({
  monthlyPrice,
}: PaymentBenefitsComparisonProps) {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  const yearlyPrice = monthlyPrice * 12;

  const comparisonData: ComparisonRow[] = [
    {
      feature: "Waiting Period",
      monthly: "60-90 days",
      annual: "14 days",
      icon: <Clock className="w-5 h-5" />,
      tooltip: "Time you must wait before accessing procedures after payment",
    },
    {
      feature: "Emergency Procedures",
      monthly: "60 days wait",
      annual: "14 days wait",
      icon: <Zap className="w-5 h-5" />,
      tooltip: "Consultations and extractions",
    },
    {
      feature: "Restorative Procedures",
      monthly: "90 days wait",
      annual: "14 days wait",
      icon: <Calendar className="w-5 h-5" />,
      tooltip: "Root canal, scaling, filling, antibiotics",
    },
    {
      feature: "Total Annual Cost",
      monthly: `KES ${(monthlyPrice * 12).toLocaleString()}`,
      annual: `KES ${yearlyPrice.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
      tooltip: "Total amount paid over one year",
    },
    {
      feature: "Transaction Fees",
      monthly: "12 payments/year",
      annual: "1 payment/year",
      icon: <DollarSign className="w-5 h-5" />,
      tooltip: "Number of M-Pesa transaction fees you'll pay",
    },
    {
      feature: "Immediate Access",
      monthly: false,
      annual: true,
      icon: <Zap className="w-5 h-5" />,
      tooltip: "Get access to procedures much faster",
    },
  ];

  const renderValue = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-5 h-5 text-emerald-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-red-500 mx-auto" />
      );
    }
    return <span className="text-white">{value}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Compare Payment Plans
        </h2>
        <p className="text-gray-400">
          See the differences between monthly and annual payments
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700/50 border-b border-gray-700">
          <div className="text-sm font-semibold text-gray-400">Feature</div>
          <div className="text-sm font-semibold text-white text-center">
            Monthly Plan
          </div>
          <div className="text-sm font-semibold text-emerald-400 text-center flex items-center justify-center gap-2">
            Annual Plan
            <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
              BEST VALUE
            </span>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-700">
          {comparisonData.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-gray-400">{row.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {row.feature}
                    </span>
                    {row.tooltip && (
                      <div className="relative">
                        <button
                          onMouseEnter={() => setActiveTooltip(index)}
                          onMouseLeave={() => setActiveTooltip(null)}
                          className="text-gray-500 hover:text-gray-400"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        {activeTooltip === index && (
                          <div className="absolute left-0 top-6 z-10 w-64 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
                            <p className="text-xs text-gray-300">
                              {row.tooltip}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center text-sm">
                {renderValue(row.monthly)}
              </div>
              <div className="flex items-center justify-center text-sm">
                {renderValue(row.annual)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Benefits Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-gray-700 rounded-lg p-2">
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Monthly Plan
              </h3>
              <p className="text-sm text-gray-400">Flexible payment option</p>
            </div>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              Lower upfront cost
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              Pay as you go
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-300">
              <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              Longer waiting periods (60-90 days)
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-300">
              <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              12 transaction fees per year
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 rounded-xl p-6 border-2 border-emerald-700/50">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-emerald-700 rounded-lg p-2">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Annual Plan
              </h3>
              <p className="text-sm text-emerald-400">
                Best value & fastest access
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              Only 14-day waiting period
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              Immediate access to all procedures
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              Only 1 transaction fee per year
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              Same total cost as monthly
            </li>
          </ul>
        </div>
      </div>

      {/* Savings Highlight */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 rounded-xl p-6 border border-emerald-700/50">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-700 rounded-full p-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Why Choose Annual?
            </h3>
            <p className="text-emerald-300 mb-3">
              Get access to dental care 4-6x faster with the annual plan.
              Instead of waiting 60-90 days, you only wait 14 days for all
              procedures. Plus, you save on transaction fees by paying once
              instead of 12 times per year.
            </p>
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Check className="w-4 h-4" />
              <span className="font-semibold">
                76-84% faster access to dental care
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Access Timeline Comparison
        </h3>
        <div className="space-y-6">
          {/* Monthly Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gray-700 rounded px-3 py-1 text-sm font-medium text-white">
                Monthly Plan
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: "66%" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  60-90 days
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Wait 2-3 months before accessing procedures
              </p>
            </div>
          </div>

          {/* Annual Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-emerald-700 rounded px-3 py-1 text-sm font-medium text-white">
                Annual Plan
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: "15%" }}
                  ></div>
                </div>
                <span className="text-sm text-emerald-400 whitespace-nowrap">
                  14 days
                </span>
              </div>
              <p className="text-xs text-emerald-500 mt-1">
                Get access in just 2 weeks!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
