"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

interface DisbursalManagementProps {
  claimId: string;
}

interface DisbursalRecord {
  id: string;
  claimId: string;
  clinicId: string;
  clinicName: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REVERSED";
  paymentChannel:
    | "MPESA_TILL"
    | "MPESA_PAYBILL"
    | "MPESA_MOBILE"
    | "BANK_TRANSFER";
  transactionReference: string;
  recipientIdentifier: string;
  sasaPayRequestId?: string;
  sasaPayCheckoutId?: string;
  mpesaReceiptNumber?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  reversedAt?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    metadata?: any;
  }>;
}

export function DisbursalManagement({ claimId }: DisbursalManagementProps) {
  const [disbursal, setDisbursal] = useState<DisbursalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState<
    "retry" | "reverse" | null
  >(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<
    "retry" | "reverse" | null
  >(null);
  const [reverseReason, setReverseReason] = useState("");

  useEffect(() => {
    loadDisbursalData();
  }, [claimId]);

  const loadDisbursalData = async () => {
    try {
      setIsLoading(true);
      setError("");
      // TODO: Replace with actual API call
      // const data = await adminApi.getDisbursalByClaimId(claimId);
      // setDisbursal(data);

      // Mock data for now
      setDisbursal({
        id: "disb_123",
        claimId,
        clinicId: "clinic_456",
        clinicName: "Sample Dental Clinic",
        amount: 5000,
        status: "COMPLETED",
        paymentChannel: "MPESA_TILL",
        transactionReference: "TXN123456",
        recipientIdentifier: "123456",
        mpesaReceiptNumber: "QAB1CD2EFG",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        statusHistory: [
          {
            status: "PENDING",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            status: "PROCESSING",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
          },
          { status: "COMPLETED", timestamp: new Date().toISOString() },
        ],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load disbursal data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!disbursal) return;

    try {
      setActionInProgress("retry");
      // TODO: Replace with actual API call
      // await adminApi.retryDisbursal(disbursal.id);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay

      setShowConfirmDialog(null);
      await loadDisbursalData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to retry disbursal",
      );
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReverse = async () => {
    if (!disbursal || !reverseReason.trim()) {
      setError("Please provide a reason for reversing the disbursal");
      return;
    }

    try {
      setActionInProgress("reverse");
      // TODO: Replace with actual API call
      // await adminApi.reverseDisbursal(disbursal.id, reverseReason);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay

      setShowConfirmDialog(null);
      setReverseReason("");
      await loadDisbursalData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reverse disbursal",
      );
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "PENDING":
      case "PROCESSING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "REVERSED":
        return <RotateCcw className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-emerald-400 bg-emerald-900/20 border-emerald-700/50";
      case "FAILED":
        return "text-red-400 bg-red-900/20 border-red-700/50";
      case "PENDING":
      case "PROCESSING":
        return "text-yellow-400 bg-yellow-900/20 border-yellow-700/50";
      case "REVERSED":
        return "text-gray-400 bg-gray-900/20 border-gray-700/50";
      default:
        return "text-gray-400 bg-gray-900/20 border-gray-700/50";
    }
  };

  const getPaymentChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      MPESA_TILL: "M-Pesa Till",
      MPESA_PAYBILL: "M-Pesa Paybill",
      MPESA_MOBILE: "M-Pesa Mobile",
      BANK_TRANSFER: "Bank Transfer",
    };
    return labels[channel] || channel;
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

  if (error && !disbursal) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!disbursal) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <p className="text-gray-400 text-center py-8">
          No disbursal found for this claim
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Disbursal Details */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">
            Disbursal Details
          </h2>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-700/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Status and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <p className="text-sm text-gray-400 mb-2">Status</p>
              <div className="flex items-center gap-2">
                {getStatusIcon(disbursal.status)}
                <span
                  className={`text-sm px-2 py-1 rounded border ${getStatusColor(disbursal.status)}`}
                >
                  {disbursal.status}
                </span>
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <p className="text-sm text-gray-400 mb-2">Amount</p>
              <p className="text-2xl font-bold text-white">
                KES {disbursal.amount.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <p className="text-sm text-gray-400 mb-2">Payment Channel</p>
              <p className="text-white font-medium">
                {getPaymentChannelLabel(disbursal.paymentChannel)}
              </p>
            </div>
          </div>

          {/* Clinic and Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Clinic Name</p>
              <p className="text-white">{disbursal.clinicName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">
                Transaction Reference
              </p>
              <p className="text-white font-mono">
                {disbursal.transactionReference}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Recipient Identifier</p>
              <p className="text-white font-mono">
                {disbursal.recipientIdentifier}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Created At</p>
              <p className="text-white">
                {new Date(disbursal.createdAt).toLocaleString()}
              </p>
            </div>
            {disbursal.completedAt && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Completed At</p>
                <p className="text-white">
                  {new Date(disbursal.completedAt).toLocaleString()}
                </p>
              </div>
            )}
            {disbursal.reversedAt && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Reversed At</p>
                <p className="text-white">
                  {new Date(disbursal.reversedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* SasaPay Information */}
          {(disbursal.sasaPayRequestId ||
            disbursal.sasaPayCheckoutId ||
            disbursal.mpesaReceiptNumber) && (
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                SasaPay Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {disbursal.sasaPayRequestId && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      SasaPay Request ID
                    </p>
                    <p className="text-white font-mono text-sm">
                      {disbursal.sasaPayRequestId}
                    </p>
                  </div>
                )}
                {disbursal.sasaPayCheckoutId && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      SasaPay Checkout ID
                    </p>
                    <p className="text-white font-mono text-sm">
                      {disbursal.sasaPayCheckoutId}
                    </p>
                  </div>
                )}
                {disbursal.mpesaReceiptNumber && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      M-Pesa Receipt Number
                    </p>
                    <p className="text-white font-mono text-sm">
                      {disbursal.mpesaReceiptNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {disbursal.errorMessage && (
            <div className="border-t border-gray-700 pt-4">
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-400 mb-1">
                      Error Details
                    </p>
                    <p className="text-sm text-red-300">
                      {disbursal.errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status History */}
          {disbursal.statusHistory && disbursal.statusHistory.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Status History
              </h4>
              <div className="space-y-2">
                {disbursal.statusHistory.map((entry, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    {getStatusIcon(entry.status)}
                    <span className="text-white">{entry.status}</span>
                    <span className="text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex gap-3">
              {disbursal.status === "FAILED" && (
                <button
                  onClick={() => setShowConfirmDialog("retry")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Disbursal
                </button>
              )}
              {disbursal.status === "COMPLETED" && (
                <button
                  onClick={() => setShowConfirmDialog("reverse")}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reverse Disbursal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {showConfirmDialog === "retry"
                    ? "Confirm Retry"
                    : "Confirm Reversal"}
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  {showConfirmDialog === "retry"
                    ? "Are you sure you want to retry this disbursal? A new payment attempt will be initiated."
                    : "Are you sure you want to reverse this disbursal? The claim limit will be restored to the member."}
                </p>

                {showConfirmDialog === "reverse" && (
                  <div className="mb-4">
                    <label
                      htmlFor="reverseReason"
                      className="block text-sm font-medium text-gray-400 mb-2"
                    >
                      Reason (required)
                    </label>
                    <textarea
                      id="reverseReason"
                      value={reverseReason}
                      onChange={(e) => setReverseReason(e.target.value)}
                      rows={3}
                      placeholder="Enter the reason for reversing this disbursal..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmDialog(null);
                  setReverseReason("");
                }}
                disabled={actionInProgress !== null}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={
                  showConfirmDialog === "retry" ? handleRetry : handleReverse
                }
                disabled={actionInProgress !== null}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {actionInProgress ? (
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
