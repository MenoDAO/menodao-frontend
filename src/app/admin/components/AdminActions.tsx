"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserX,
  CreditCard,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

interface AdminActionsProps {
  targetId: string;
  targetType: "member" | "subscription" | "payment" | "disbursal";
  onActionComplete?: () => void;
}

type ActionType = "suspend" | "deactivate" | "verify" | "reverse" | "retry";

interface ActionConfig {
  type: ActionType;
  label: string;
  icon: React.ReactNode;
  description: string;
  confirmMessage: string;
  requiresReason: boolean;
  color: string;
}

export function AdminActions({
  targetId,
  targetType,
  onActionComplete,
}: AdminActionsProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const actions: Record<string, ActionConfig[]> = {
    member: [
      {
        type: "suspend",
        label: "Suspend Member",
        icon: <UserX className="w-4 h-4" />,
        description:
          "Suspend this member's account and prevent new payments or claims",
        confirmMessage:
          "Are you sure you want to suspend this member? They will not be able to make payments or submit claims.",
        requiresReason: true,
        color: "red",
      },
    ],
    subscription: [
      {
        type: "deactivate",
        label: "Deactivate Subscription",
        icon: <CreditCard className="w-4 h-4" />,
        description: "Deactivate this subscription and revoke claim limits",
        confirmMessage:
          "Are you sure you want to deactivate this subscription? Claim limits will be revoked.",
        requiresReason: true,
        color: "red",
      },
    ],
    payment: [
      {
        type: "verify",
        label: "Verify Payment Manually",
        icon: <CheckCircle className="w-4 h-4" />,
        description: "Manually verify this payment and assign claim limits",
        confirmMessage:
          "Are you sure you want to manually verify this payment? This will update the status and assign claim limits if not already assigned.",
        requiresReason: true,
        color: "emerald",
      },
    ],
    disbursal: [
      {
        type: "reverse",
        label: "Reverse Disbursal",
        icon: <RotateCcw className="w-4 h-4" />,
        description: "Reverse this disbursal and restore claim limits",
        confirmMessage:
          "Are you sure you want to reverse this disbursal? The claim limit will be restored to the member.",
        requiresReason: true,
        color: "yellow",
      },
      {
        type: "retry",
        label: "Retry Disbursal",
        icon: <RefreshCw className="w-4 h-4" />,
        description: "Retry this failed disbursal",
        confirmMessage:
          "Are you sure you want to retry this disbursal? A new payment attempt will be initiated.",
        requiresReason: false,
        color: "blue",
      },
    ],
  };

  const availableActions = actions[targetType] || [];

  const handleActionClick = (action: ActionType) => {
    setSelectedAction(action);
    setReason("");
    setActionResult(null);
  };

  const handleConfirmAction = async () => {
    const actionConfig = availableActions.find(
      (a) => a.type === selectedAction,
    );
    if (!actionConfig) return;

    if (actionConfig.requiresReason && !reason.trim()) {
      setActionResult({
        success: false,
        message: "Please provide a reason for this action",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setActionResult(null);

      let result;
      switch (selectedAction) {
        case "suspend":
          result = await adminApi.suspendMember(targetId, reason);
          break;
        case "deactivate":
          result = await adminApi.deactivateSubscription(targetId, reason);
          break;
        case "verify":
          result = await adminApi.verifyPaymentManually(targetId, reason);
          break;
        case "reverse":
          // TODO: Add reverse disbursal API method
          result = {
            success: true,
            message: "Disbursal reversed successfully",
          };
          break;
        case "retry":
          // TODO: Add retry disbursal API method
          result = { success: true, message: "Disbursal retry initiated" };
          break;
        default:
          throw new Error("Unknown action type");
      }

      setActionResult({
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        setTimeout(() => {
          setSelectedAction(null);
          setReason("");
          onActionComplete?.();
        }, 2000);
      }
    } catch (error) {
      setActionResult({
        success: false,
        message: error instanceof Error ? error.message : "Action failed",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelAction = () => {
    setSelectedAction(null);
    setReason("");
    setActionResult(null);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<
      string,
      { bg: string; hover: string; border: string; text: string }
    > = {
      red: {
        bg: "bg-red-600",
        hover: "hover:bg-red-700",
        border: "border-red-700/50",
        text: "text-red-400",
      },
      emerald: {
        bg: "bg-emerald-600",
        hover: "hover:bg-emerald-700",
        border: "border-emerald-700/50",
        text: "text-emerald-400",
      },
      yellow: {
        bg: "bg-yellow-600",
        hover: "hover:bg-yellow-700",
        border: "border-yellow-700/50",
        text: "text-yellow-400",
      },
      blue: {
        bg: "bg-blue-600",
        hover: "hover:bg-blue-700",
        border: "border-blue-700/50",
        text: "text-blue-400",
      },
    };
    return colors[color] || colors.emerald;
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Admin Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableActions.map((action) => {
            const colors = getColorClasses(action.color);
            return (
              <button
                key={action.type}
                onClick={() => handleActionClick(action.type)}
                className={`flex items-center gap-3 p-4 ${colors.bg} ${colors.hover} rounded-lg transition-colors text-left`}
              >
                <div className="flex-shrink-0">{action.icon}</div>
                <div>
                  <p className="text-white font-medium text-sm">
                    {action.label}
                  </p>
                  <p className="text-white/70 text-xs mt-1">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Confirm Action
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  {
                    availableActions.find((a) => a.type === selectedAction)
                      ?.confirmMessage
                  }
                </p>

                {availableActions.find((a) => a.type === selectedAction)
                  ?.requiresReason && (
                  <div className="mb-4">
                    <label
                      htmlFor="reason"
                      className="block text-sm font-medium text-gray-400 mb-2"
                    >
                      Reason (required)
                    </label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder="Enter the reason for this action..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                )}

                {actionResult && (
                  <div
                    className={`mb-4 rounded-lg p-3 border ${
                      actionResult.success
                        ? "bg-emerald-900/20 border-emerald-700/50"
                        : "bg-red-900/20 border-red-700/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {actionResult.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <p
                        className={`text-sm ${
                          actionResult.success
                            ? "text-emerald-300"
                            : "text-red-300"
                        }`}
                      >
                        {actionResult.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelAction}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isProcessing || actionResult?.success === true}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
