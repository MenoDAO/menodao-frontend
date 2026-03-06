"use client";

import { useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { adminApi, ReconciliationReport } from "@/lib/admin-api";

export function PaymentReconciliation() {
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [syncResults, setSyncResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateRange.from || !dateRange.to) {
      setError("Please select both start and end dates");
      return;
    }

    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    if (toDate < fromDate) {
      setError("End date must be after start date");
      return;
    }

    try {
      setIsReconciling(true);
      setError("");
      setSyncResults({});

      const result = await adminApi.reconcilePayments(
        dateRange.from,
        dateRange.to,
      );
      setReport(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reconcile payments",
      );
      setReport(null);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleSyncPayment = async (paymentId: string) => {
    try {
      setIsSyncing(paymentId);
      const result = await adminApi.syncPaymentStatus(paymentId);

      setSyncResults((prev) => ({
        ...prev,
        [paymentId]: result,
      }));

      // Refresh reconciliation report after sync
      if (dateRange.from && dateRange.to) {
        const updatedReport = await adminApi.reconcilePayments(
          dateRange.from,
          dateRange.to,
        );
        setReport(updatedReport);
      }
    } catch (err) {
      setSyncResults((prev) => ({
        ...prev,
        [paymentId]: {
          success: false,
          message: err instanceof Error ? err.message : "Sync failed",
        },
      }));
    } finally {
      setIsSyncing(null);
    }
  };

  const handleExportReport = () => {
    if (!report) return;

    const csvContent = [
      [
        "Transaction ID",
        "Local Status",
        "SasaPay Status",
        "Amount",
        "Created At",
      ],
      ...report.discrepancies.map((d) => [
        d.transactionId,
        d.localStatus,
        d.sasaPayStatus,
        d.amount.toString(),
        new Date(d.createdAt).toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-reconciliation-${dateRange.from}-to-${dateRange.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <RefreshCw className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">
            Payment Reconciliation
          </h2>
        </div>

        <form onSubmit={handleReconcile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dateFrom"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Start Date
              </label>
              <input
                type="date"
                id="dateFrom"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="dateTo"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                End Date
              </label>
              <input
                type="date"
                id="dateTo"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isReconciling}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isReconciling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Reconciling...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Run Reconciliation
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Reconciliation Results */}
      {report && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              Reconciliation Report
            </h3>
            {report.discrepancies.length > 0 && (
              <button
                onClick={handleExportReport}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <p className="text-sm text-gray-400 mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-white">
                {report.summary.totalPayments}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <p className="text-sm text-gray-400 mb-1">Matched Payments</p>
              <p className="text-2xl font-bold text-emerald-400">
                {report.summary.matchedPayments}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <p className="text-sm text-gray-400 mb-1">Discrepancies</p>
              <p className="text-2xl font-bold text-red-400">
                {report.summary.discrepancies}
              </p>
            </div>
          </div>

          {/* Discrepancies List */}
          {report.discrepancies.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white mb-3">
                Payment Discrepancies
              </h4>
              {report.discrepancies.map((discrepancy) => (
                <div
                  key={discrepancy.paymentId}
                  className="bg-gray-700/50 rounded-lg p-4 border border-red-700/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <p className="text-white font-medium font-mono">
                          {discrepancy.transactionId}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400">Local Status</p>
                          <p className="text-white">
                            {discrepancy.localStatus}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">SasaPay Status</p>
                          <p className="text-white">
                            {discrepancy.sasaPayStatus}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Amount</p>
                          <p className="text-white">
                            KES {discrepancy.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Created At</p>
                          <p className="text-white">
                            {new Date(
                              discrepancy.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSyncPayment(discrepancy.paymentId)}
                      disabled={isSyncing === discrepancy.paymentId}
                      className="ml-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isSyncing === discrepancy.paymentId ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Sync
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sync Result */}
                  {syncResults[discrepancy.paymentId] && (
                    <div
                      className={`mt-3 rounded-lg p-3 border ${
                        syncResults[discrepancy.paymentId].success
                          ? "bg-emerald-900/20 border-emerald-700/50"
                          : "bg-red-900/20 border-red-700/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {syncResults[discrepancy.paymentId].success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <p
                          className={`text-sm ${
                            syncResults[discrepancy.paymentId].success
                              ? "text-emerald-300"
                              : "text-red-300"
                          }`}
                        >
                          {syncResults[discrepancy.paymentId].message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="text-emerald-400 font-semibold mb-1">
                    All Payments Match
                  </p>
                  <p className="text-sm text-emerald-300">
                    No discrepancies found between local records and SasaPay for
                    the selected date range.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
