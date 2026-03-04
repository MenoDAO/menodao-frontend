"use client";

import { useState } from "react";
import {
  Search,
  X,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

interface PaymentSearchProps {
  onPaymentSelected?: (payment: PaymentDetailResponse) => void;
}

interface PaymentDetailResponse {
  id: string;
  transactionId: string;
  userId: string;
  userPhone: string;
  userEmail: string;
  amount: number;
  status: string;
  subscriptionType: string;
  paymentFrequency: "MONTHLY" | "ANNUAL";
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  claimLimitsAssigned: boolean;
  claimLimitsAssignedAt?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    metadata?: any;
  }>;
  sasaPayData: {
    merchantRequestId?: string;
    checkoutRequestId?: string;
    mpesaReceiptNumber?: string;
  };
  relatedLinks: {
    userProfile: string;
    subscription: string;
    claims: string[];
  };
}

export function PaymentSearch({ onPaymentSelected }: PaymentSearchProps) {
  const [searchParams, setSearchParams] = useState({
    transactionId: "",
    phoneNumber: "",
    email: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });
  const [searchResults, setSearchResults] = useState<PaymentDetailResponse[]>(
    [],
  );
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentDetailResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one search parameter is provided
    const hasSearchParam = Object.values(searchParams).some(
      (val) => val.trim() !== "",
    );
    if (!hasSearchParam) {
      setSearchError("Please provide at least one search parameter");
      return;
    }

    try {
      setIsSearching(true);
      setSearchError("");

      const results = await adminApi.searchPayments(searchParams);
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError("No payments found matching your search criteria");
      }
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Failed to search payments",
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewDetail = async (transactionId: string) => {
    try {
      const detail = await adminApi.getPaymentDetail(transactionId);
      setSelectedPayment(detail);
      onPaymentSelected?.(detail);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "Failed to load payment details",
      );
    }
  };

  const handleClearSearch = () => {
    setSearchParams({
      transactionId: "",
      phoneNumber: "",
      email: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    });
    setSearchResults([]);
    setSearchError("");
    setSelectedPayment(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
      case "COMPLETED":
        return "text-emerald-400 bg-emerald-900/20 border-emerald-700/50";
      case "FAILED":
        return "text-red-400 bg-red-900/20 border-red-700/50";
      case "PENDING":
        return "text-yellow-400 bg-yellow-900/20 border-yellow-700/50";
      default:
        return "text-gray-400 bg-gray-900/20 border-gray-700/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <Search className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">Search Payments</h2>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="transactionId"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Transaction ID
              </label>
              <input
                type="text"
                id="transactionId"
                value={searchParams.transactionId}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    transactionId: e.target.value,
                  }))
                }
                placeholder="Enter transaction ID"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={searchParams.phoneNumber}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                placeholder="+254712345678"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={searchParams.email}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="user@example.com"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                value={searchParams.status}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="dateFrom"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Date From
              </label>
              <input
                type="date"
                id="dateFrom"
                value={searchParams.dateFrom}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    dateFrom: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="dateTo"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Date To
              </label>
              <input
                type="date"
                id="dateTo"
                value={searchParams.dateTo}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    dateTo: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {searchError && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
              <p className="text-sm text-red-400">{searchError}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-3">
            {searchResults.map((payment) => (
              <div
                key={payment.id}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-emerald-500/50 transition-colors cursor-pointer"
                onClick={() => handleViewDetail(payment.transactionId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(payment.status)}
                      <span
                        className={`text-sm px-2 py-1 rounded border ${getStatusColor(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {payment.paymentFrequency}
                      </span>
                    </div>
                    <p className="text-white font-medium mb-1">
                      {payment.transactionId}
                    </p>
                    <p className="text-sm text-gray-400">
                      {payment.userPhone} • {payment.userEmail}
                    </p>
                    <p className="text-sm text-gray-400">
                      {payment.subscriptionType} • KES{" "}
                      {payment.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                    <ExternalLink className="w-4 h-4 text-emerald-500 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full border border-gray-700 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Payment Details
              </h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Transaction ID</p>
                  <p className="text-white font-mono">
                    {selectedPayment.transactionId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedPayment.status)}
                    <span
                      className={`text-sm px-2 py-1 rounded border ${getStatusColor(selectedPayment.status)}`}
                    >
                      {selectedPayment.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Amount</p>
                  <p className="text-white font-semibold">
                    KES {selectedPayment.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Payment Frequency
                  </p>
                  <p className="text-white">
                    {selectedPayment.paymentFrequency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Subscription Type
                  </p>
                  <p className="text-white">
                    {selectedPayment.subscriptionType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">User Phone</p>
                  <p className="text-white">{selectedPayment.userPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">User Email</p>
                  <p className="text-white">{selectedPayment.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Created At</p>
                  <p className="text-white">
                    {new Date(selectedPayment.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedPayment.confirmedAt && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Confirmed At</p>
                    <p className="text-white">
                      {new Date(selectedPayment.confirmedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Claim Limits */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Claim Limits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Limits Assigned
                    </p>
                    <p className="text-white">
                      {selectedPayment.claimLimitsAssigned ? "Yes" : "No"}
                    </p>
                  </div>
                  {selectedPayment.claimLimitsAssignedAt && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Assigned At</p>
                      <p className="text-white">
                        {new Date(
                          selectedPayment.claimLimitsAssignedAt,
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SasaPay Data */}
              {(selectedPayment.sasaPayData.merchantRequestId ||
                selectedPayment.sasaPayData.checkoutRequestId ||
                selectedPayment.sasaPayData.mpesaReceiptNumber) && (
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    SasaPay Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPayment.sasaPayData.merchantRequestId && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">
                          Merchant Request ID
                        </p>
                        <p className="text-white font-mono text-sm">
                          {selectedPayment.sasaPayData.merchantRequestId}
                        </p>
                      </div>
                    )}
                    {selectedPayment.sasaPayData.checkoutRequestId && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">
                          Checkout Request ID
                        </p>
                        <p className="text-white font-mono text-sm">
                          {selectedPayment.sasaPayData.checkoutRequestId}
                        </p>
                      </div>
                    )}
                    {selectedPayment.sasaPayData.mpesaReceiptNumber && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">
                          M-Pesa Receipt Number
                        </p>
                        <p className="text-white font-mono text-sm">
                          {selectedPayment.sasaPayData.mpesaReceiptNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status History */}
              {selectedPayment.statusHistory &&
                selectedPayment.statusHistory.length > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold text-white mb-3">
                      Status History
                    </h4>
                    <div className="space-y-2">
                      {selectedPayment.statusHistory.map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 text-sm"
                        >
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

              {/* Related Links */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Related Records
                </h4>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/admin/users/${selectedPayment.userId}`}
                    className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors"
                  >
                    View User Profile
                  </a>
                  {selectedPayment.relatedLinks.subscription && (
                    <a
                      href={selectedPayment.relatedLinks.subscription}
                      className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors"
                    >
                      View Subscription
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
