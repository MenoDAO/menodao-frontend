"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertCircle, Info } from "lucide-react";

interface WaitingPeriodDisplayProps {
  memberId: string;
}

interface ProcedureWaitingStatus {
  category: string;
  procedures: string[];
  available: boolean;
  daysRemaining: number;
  requiredDays: number;
}

interface WaitingPeriodStatus {
  consultationsExtractions: {
    available: boolean;
    daysRemaining: number;
  };
  restorativeProcedures: {
    available: boolean;
    daysRemaining: number;
  };
  paymentFrequency: "MONTHLY" | "ANNUAL";
  subscriptionStartDate: string;
}

export function WaitingPeriodDisplay({ memberId }: WaitingPeriodDisplayProps) {
  const [status, setStatus] = useState<WaitingPeriodStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWaitingPeriodStatus();
  }, [memberId]);

  const loadWaitingPeriodStatus = async () => {
    try {
      setIsLoading(true);
      setError("");

      // TODO: Replace with actual API call
      // const data = await api.getWaitingPeriodStatus(memberId);
      // setStatus(data);

      // Mock data for now
      setStatus({
        consultationsExtractions: {
          available: true,
          daysRemaining: 0,
        },
        restorativeProcedures: {
          available: false,
          daysRemaining: 15,
        },
        paymentFrequency: "MONTHLY",
        subscriptionStartDate: new Date(
          Date.now() - 75 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load waiting period status",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getProcedureStatuses = (): ProcedureWaitingStatus[] => {
    if (!status) return [];

    return [
      {
        category: "Consultations & Extractions",
        procedures: [
          "Dental Consultations",
          "Tooth Extractions",
          "Emergency Care",
        ],
        available: status.consultationsExtractions.available,
        daysRemaining: status.consultationsExtractions.daysRemaining,
        requiredDays: status.paymentFrequency === "MONTHLY" ? 60 : 14,
      },
      {
        category: "Restorative Procedures",
        procedures: [
          "Root Canal",
          "Scaling & Polishing",
          "Fillings",
          "Antibiotics",
        ],
        available: status.restorativeProcedures.available,
        daysRemaining: status.restorativeProcedures.daysRemaining,
        requiredDays: status.paymentFrequency === "MONTHLY" ? 90 : 14,
      },
    ];
  };

  const getStatusColor = (available: boolean, daysRemaining: number) => {
    if (available) {
      return {
        bg: "bg-emerald-900/20",
        border: "border-emerald-700/50",
        text: "text-emerald-400",
        icon: "text-emerald-500",
      };
    } else if (daysRemaining <= 7) {
      return {
        bg: "bg-yellow-900/20",
        border: "border-yellow-700/50",
        text: "text-yellow-400",
        icon: "text-yellow-500",
      };
    } else {
      return {
        bg: "bg-red-900/20",
        border: "border-red-700/50",
        text: "text-red-400",
        icon: "text-red-500",
      };
    }
  };

  const formatDaysRemaining = (days: number) => {
    if (days === 0) return "Available Now";
    if (days === 1) return "1 day remaining";
    return `${days} days remaining`;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const procedureStatuses = getProcedureStatuses();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">
            Procedure Availability
          </h2>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Your subscription started on{" "}
          <span className="text-white font-medium">
            {new Date(status.subscriptionStartDate).toLocaleDateString()}
          </span>{" "}
          with a{" "}
          <span className="text-white font-medium">
            {status.paymentFrequency.toLowerCase()}
          </span>{" "}
          payment plan.
        </p>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">
                {status.paymentFrequency === "MONTHLY"
                  ? "Monthly Payment Waiting Periods"
                  : "Annual Payment Waiting Period"}
              </p>
              <p className="text-sm text-blue-300">
                {status.paymentFrequency === "MONTHLY"
                  ? "With monthly payments, you have different waiting periods: 60 days for consultations/extractions and 90 days for restorative procedures."
                  : "With annual payment, all procedures have a universal 14-day waiting period. Much faster access to care!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Procedure Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {procedureStatuses.map((procedure, index) => {
          const colors = getStatusColor(
            procedure.available,
            procedure.daysRemaining,
          );

          return (
            <div
              key={index}
              className={`${colors.bg} rounded-xl p-6 border ${colors.border}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {procedure.available ? (
                    <CheckCircle className={`w-6 h-6 ${colors.icon}`} />
                  ) : (
                    <Clock className={`w-6 h-6 ${colors.icon}`} />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {procedure.category}
                    </h3>
                    <p className={`text-sm ${colors.text} font-medium mt-1`}>
                      {procedure.available
                        ? "Available Now"
                        : formatDaysRemaining(procedure.daysRemaining)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {!procedure.available && (
                <div className="mb-4">
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        procedure.daysRemaining <= 7
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      } transition-all duration-300`}
                      style={{
                        width: `${
                          ((procedure.requiredDays - procedure.daysRemaining) /
                            procedure.requiredDays) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>
                      {procedure.requiredDays - procedure.daysRemaining} days
                      passed
                    </span>
                    <span>{procedure.requiredDays} days required</span>
                  </div>
                </div>
              )}

              {/* Procedures List */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase">
                  Included Procedures
                </p>
                <ul className="space-y-1">
                  {procedure.procedures.map((proc, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <div className="w-1 h-1 bg-gray-500 rounded-full" />
                      {proc}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Countdown for near-available procedures */}
              {!procedure.available && procedure.daysRemaining <= 7 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-yellow-400 font-medium">
                    Almost there! Just {procedure.daysRemaining} more day
                    {procedure.daysRemaining !== 1 ? "s" : ""} to go.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrade Suggestion for Monthly Users */}
      {status.paymentFrequency === "MONTHLY" &&
        !procedureStatuses.every((p) => p.available) && (
          <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 rounded-xl p-6 border border-emerald-700/50">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-700 rounded-full p-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Want Faster Access?
                </h3>
                <p className="text-emerald-300 mb-3">
                  Upgrade to an annual payment plan and get access to all
                  procedures in just 14 days instead of waiting 60-90 days. Same
                  total cost, much faster access!
                </p>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                  Learn About Annual Plans
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
