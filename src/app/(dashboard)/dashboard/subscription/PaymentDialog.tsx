"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { PaymentFrequencySelector } from "@/app/payment/components/PaymentFrequencySelector";
import {
  getPaymentAmount,
  validatePaymentAmount,
  type SubscriptionTier,
  type PaymentFrequency,
} from "@/lib/payment-config";
import {
  X,
  Phone,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  Smartphone,
} from "lucide-react";

type PaymentStatus =
  | "IDLE"
  | "FREQUENCY_SELECT"
  | "STARTED"
  | "PENDING"
  | "COMPLETED"
  | "FAILED";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  tier: "BRONZE" | "SILVER" | "GOLD";
  onPaymentComplete: () => void;
  isUpgrade?: boolean;
  currentTier?: "BRONZE" | "SILVER" | "GOLD";
  onSubscribe?: (
    tier: "BRONZE" | "SILVER" | "GOLD",
    frequency: "MONTHLY" | "ANNUAL",
  ) => Promise<void>;
}

// Map tier names to payment config format
const mapTierToConfigTier = (
  tier: "BRONZE" | "SILVER" | "GOLD",
): SubscriptionTier => {
  const tierMap: Record<string, SubscriptionTier> = {
    BRONZE: "MenoBronze",
    SILVER: "MenoSilver",
    GOLD: "MenoGold",
  };
  return tierMap[tier];
};

export default function PaymentDialog({
  isOpen,
  onClose,
  amount,
  tier,
  onPaymentComplete,
  isUpgrade = false,
  currentTier,
  onSubscribe,
}: PaymentDialogProps) {
  const member = useAuthStore((state) => state.member);
  const [payerPhone, setPayerPhone] = useState("");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("FREQUENCY_SELECT");
  const [statusMessage, setStatusMessage] = useState("");
  const [contributionId, setContributionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<
    "MONTHLY" | "ANNUAL" | null
  >(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(amount);
  const [displayAmount, setDisplayAmount] = useState<number>(amount);
  const [upgradeInfo, setUpgradeInfo] = useState<{
    paymentAmount: number;
    displayAmount: number;
    message: string;
  } | null>(null);

  // Fetch upgrade info when dialog opens for upgrade
  // Only fetch if this is truly an upgrade (not same tier) and we're in the right state
  useEffect(() => {
    if (
      isOpen &&
      isUpgrade &&
      tier &&
      currentTier &&
      tier !== currentTier &&
      (paymentStatus === "FREQUENCY_SELECT" || paymentStatus === "IDLE")
    ) {
      api
        .upgrade(tier)
        .then((info) => {
          setUpgradeInfo({
            paymentAmount: info.paymentAmount,
            displayAmount: info.displayAmount,
            message: info.message,
          });
          // Use paymentAmount for actual payment (respects dev/prod pricing)
          setSelectedAmount(info.paymentAmount);
          // Use displayAmount for UI display (always production pricing)
          setDisplayAmount(info.displayAmount);
        })
        .catch((error) => {
          setErrorMessage((error as Error).message);
          setPaymentStatus("FAILED");
        });
    }
  }, [isOpen, isUpgrade, tier, currentTier, paymentStatus]);

  // Reset state when dialog opens (only when transitioning from closed to open)
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    // Only reset if dialog is opening (was closed, now open)
    if (isOpen && !prevIsOpenRef.current) {
      setPayerPhone("");
      // For active subscriptions (regular payments), skip frequency selection
      // For new subscriptions or upgrades, show frequency selection
      setPaymentStatus(!isUpgrade && onSubscribe ? "FREQUENCY_SELECT" : "IDLE");
      setStatusMessage("");
      setContributionId(null);
      setErrorMessage(null);
      setValidationError(null);
      setSelectedFrequency(null);
      setSelectedAmount(amount);
      setDisplayAmount(amount);
      setUpgradeInfo(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, amount, isUpgrade, onSubscribe]);

  // Payment initiation mutation
  const paymentMutation = useMutation({
    mutationFn: ({
      amount,
      phoneNumber,
    }: {
      amount: number;
      phoneNumber?: string;
    }) => {
      // Validate amount before initiating payment
      const configTier = mapTierToConfigTier(tier);
      const frequency: PaymentFrequency =
        selectedFrequency === "ANNUAL" ? "yearly" : "monthly";

      console.log("[PaymentDialog] Initiating payment:", {
        tier: configTier,
        frequency,
        amount,
        selectedAmount,
        displayAmount,
        selectedFrequency,
        isUpgrade,
        phoneNumber,
      });

      // Validate the amount matches expected (skip validation for upgrades)
      if (!isUpgrade) {
        const isValid = validatePaymentAmount(configTier, frequency, amount);
        if (!isValid) {
          const expectedAmount = getPaymentAmount(configTier, frequency);
          throw new Error(
            `Payment amount mismatch. Expected KES ${expectedAmount}, got KES ${amount}. Please refresh and try again.`,
          );
        }
      }

      return api.initiatePayment(
        amount,
        "MPESA",
        phoneNumber,
        isUpgrade,
        isUpgrade ? tier : undefined,
      );
    },
    onSuccess: (data) => {
      setContributionId(data.contributionId);
      setPaymentStatus("PENDING");
      setStatusMessage("Check your phone for M-Pesa prompt");
    },
    onError: (error: Error) => {
      setPaymentStatus("FAILED");
      setErrorMessage(error.message || "Failed to initiate payment");
    },
  });

  // Poll for payment status
  const checkStatus = useCallback(async () => {
    if (
      !contributionId ||
      paymentStatus === "COMPLETED" ||
      paymentStatus === "FAILED"
    ) {
      return;
    }

    try {
      const status = await api.checkPaymentStatus(contributionId);

      if (status.status === "COMPLETED") {
        setPaymentStatus("COMPLETED");
        setStatusMessage("Payment successful!");
        onPaymentComplete();
      } else if (status.status === "FAILED") {
        setPaymentStatus("FAILED");
        setErrorMessage("Payment was not completed. Please try again.");
      }
    } catch (error) {
      // Continue polling on error
      console.error("Status check error:", error);
    }
  }, [contributionId, paymentStatus, onPaymentComplete]);

  // Polling effect
  useEffect(() => {
    if (paymentStatus !== "PENDING" || !contributionId) {
      return;
    }

    const interval = setInterval(checkStatus, 3000); // Poll every 3 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (paymentStatus === "PENDING") {
        setStatusMessage(
          "Payment is taking longer than expected. We're still checking... You can close this dialog and check your subscription status.",
        );
      }
    }, 300000); // Stop polling after 5 minutes (increased from 2 minutes)

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [paymentStatus, contributionId, checkStatus]);

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return true; // Empty is valid (will use registered number)
    return /^(\+?254|0)?[17]\d{8}$/.test(phone.trim());
  };

  const handlePayment = () => {
    setValidationError(null);

    // Safety check: For non-upgrade payments, ensure we have selected a frequency
    // This means the subscription should have been created
    if (!isUpgrade && !selectedFrequency) {
      setValidationError("Please select a payment frequency first");
      return;
    }

    // Safety check: Ensure amount is valid (minimum 10 KES)
    if (selectedAmount < 10) {
      setValidationError(
        "Invalid payment amount. Please refresh the page and try again.",
      );
      return;
    }

    const phoneToUse = payerPhone.trim() || undefined;

    if (phoneToUse && !validatePhone(phoneToUse)) {
      setValidationError(
        "Please enter a valid Kenyan phone number (e.g., 0712345678)",
      );
      return;
    }

    setPaymentStatus("STARTED");
    setStatusMessage("Initiating payment...");

    paymentMutation.mutate({
      amount: selectedAmount,
      phoneNumber: phoneToUse,
    });
  };

  const useMyNumber = () => {
    if (member?.phoneNumber) {
      setPayerPhone(member.phoneNumber);
      setValidationError(null);
    }
  };

  const handleClose = () => {
    if (paymentStatus === "PENDING") {
      // Allow closing during pending but warn user
      const confirmClose = window.confirm(
        "Payment is still processing. Are you sure you want to close? You can check your payment history later.",
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  const handleFrequencySelect = (
    frequency: "MONTHLY" | "ANNUAL",
    amount: number,
  ) => {
    setSelectedFrequency(frequency);
    setSelectedAmount(amount);
    // Update displayAmount as well so it shows in the UI
    setDisplayAmount(amount);

    // Log the selected amount for verification
    const configTier = mapTierToConfigTier(tier);
    const freq: PaymentFrequency =
      frequency === "ANNUAL" ? "yearly" : "monthly";
    const expectedAmount = getPaymentAmount(configTier, freq);

    console.log("[PaymentDialog] Frequency selected:", {
      tier: configTier,
      frequency: freq,
      selectedAmount: amount,
      expectedAmount,
      matches: amount === expectedAmount,
    });
  };

  const handleContinueToPayment = async () => {
    if (!selectedFrequency) return;

    // For new subscriptions (not upgrades), create the subscription with the selected frequency
    if (!isUpgrade && onSubscribe) {
      try {
        await onSubscribe(tier, selectedFrequency);
      } catch (error) {
        setErrorMessage((error as Error).message);
        setPaymentStatus("FAILED");
        return;
      }
    }

    setPaymentStatus("IDLE");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {paymentStatus === "COMPLETED"
              ? "Payment Complete"
              : paymentStatus === "FAILED"
                ? "Payment Failed"
                : paymentStatus === "FREQUENCY_SELECT"
                  ? "Choose Payment Plan"
                  : "Confirm Payment"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Frequency Selection State */}
          {paymentStatus === "FREQUENCY_SELECT" && !isUpgrade && (
            <>
              <PaymentFrequencySelector
                tier={tier}
                monthlyPrice={amount}
                onSelect={handleFrequencySelect}
              />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleContinueToPayment}
                  disabled={!selectedFrequency}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            </>
          )}

          {/* Upgrade - Skip frequency selection */}
          {paymentStatus === "FREQUENCY_SELECT" && isUpgrade && (
            <div className="text-center py-8">
              {upgradeInfo ? (
                <>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Upgrade to {tier}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {upgradeInfo.message}
                  </p>
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Upgrade Cost
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      KES {displayAmount.toLocaleString()}
                    </p>
                    {upgradeInfo.paymentAmount !==
                      upgradeInfo.displayAmount && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                        Dev pricing: KES{" "}
                        {upgradeInfo.paymentAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setPaymentStatus("IDLE")}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </>
              ) : (
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              )}
            </div>
          )}
          {/* Success State */}
          {paymentStatus === "COMPLETED" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6 animate-bounce-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {isUpgrade ? "Upgrade Successful!" : "Payment Successful!"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isUpgrade
                  ? `You've been upgraded to ${tier}! Your new claim limit is now active.`
                  : `Your ${tier} membership payment of KES ${displayAmount.toLocaleString()} has been received.`}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Failed State */}
          {paymentStatus === "FAILED" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6 animate-shake">
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {errorMessage || "Something went wrong with your payment."}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Please try again or contact support if the issue persists.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setPaymentStatus("FREQUENCY_SELECT");
                    setErrorMessage(null);
                  }}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {(paymentStatus === "STARTED" || paymentStatus === "PENDING") && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
                <Loader2 className="w-12 h-12 text-amber-600 dark:text-amber-400 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {paymentStatus === "STARTED"
                  ? "Initiating Payment..."
                  : "Waiting for Payment"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {statusMessage}
              </p>

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div
                  className={`w-3 h-3 rounded-full ${paymentStatus === "STARTED" || paymentStatus === "PENDING" ? "bg-emerald-500" : "bg-gray-300"}`}
                />
                <div
                  className={`w-8 h-0.5 ${paymentStatus === "PENDING" ? "bg-emerald-500" : "bg-gray-300"}`}
                />
                <div
                  className={`w-3 h-3 rounded-full ${paymentStatus === "PENDING" ? "bg-amber-500 animate-pulse" : "bg-gray-300"}`}
                />
                <div className="w-8 h-0.5 bg-gray-300" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-500">
                <p>1. Request sent ✓</p>
                <p
                  className={
                    paymentStatus === "PENDING"
                      ? "text-amber-600 dark:text-amber-400 font-medium"
                      : ""
                  }
                >
                  2.{" "}
                  {paymentStatus === "PENDING"
                    ? "Awaiting confirmation..."
                    : "Pending"}
                </p>
                <p>3. Confirm payment</p>
              </div>

              {/* Manual check status button */}
              {paymentStatus === "PENDING" && (
                <div className="mt-6">
                  <button
                    onClick={checkStatus}
                    className="px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                  >
                    Check Status Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Initial State - Phone Input */}
          {paymentStatus === "IDLE" && (
            <>
              {/* Amount Display */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {isUpgrade ? "Upgrade Cost" : "Amount to pay"}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  KES {displayAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isUpgrade
                    ? `Upgrade to ${tier}`
                    : `${tier} Membership - ${selectedFrequency === "ANNUAL" ? "Annual" : "Monthly"} Payment`}
                </p>
                {!isUpgrade && (
                  <button
                    onClick={() => setPaymentStatus("FREQUENCY_SELECT")}
                    className="text-sm text-emerald-600 hover:text-emerald-700 mt-2"
                  >
                    Change payment plan
                  </button>
                )}
              </div>

              {/* Phone Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  M-Pesa Phone Number
                </label>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={payerPhone}
                      onChange={(e) => {
                        setPayerPhone(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="e.g. 0712345678"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={useMyNumber}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Use My Registered Number
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Leave empty to use your registered number (
                  {member?.phoneNumber || "not set"})
                </p>
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {validationError}
                </div>
              )}

              {/* M-Pesa Info */}
              <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-6">
                <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-800 dark:text-emerald-300">
                  <p className="font-medium mb-1">How M-Pesa Payment Works</p>
                  <p className="text-emerald-700 dark:text-emerald-400">
                    You will receive an M-Pesa prompt on your phone. Enter your
                    PIN to complete the payment.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paymentMutation.isPending}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Pay KES {displayAmount.toLocaleString()}</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
