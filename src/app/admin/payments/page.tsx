"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type FinancialSummary } from "@/lib/admin-api";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Wallet,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETED: "bg-emerald-500/20 text-emerald-400",
    PENDING: "bg-yellow-500/20 text-yellow-400",
    FAILED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-purple-500/20 text-purple-400",
    DISBURSED: "bg-blue-500/20 text-blue-400",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-gray-500/20 text-gray-400"}`}
    >
      {status}
    </span>
  );
}

type ActiveTab = "collections" | "disbursals";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("collections");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "admin",
      "payments",
      page,
      search,
      statusFilter,
      startDate,
      endDate,
    ],
    queryFn: () =>
      adminApi.listPayments({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const { data: summary } = useQuery({
    queryKey: ["admin", "payments", "summary"],
    queryFn: () => adminApi.getPaymentSummary(),
  });

  const { data: financialSummary, isLoading: financialLoading } = useQuery({
    queryKey: ["admin", "payments", "financial-summary"],
    queryFn: () => adminApi.getFinancialSummary(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const totalCompleted =
    summary?.find((s) => s.status === "COMPLETED")?.totalAmount || 0;
  const totalPending = summary?.find((s) => s.status === "PENDING")?.count || 0;
  const totalFailed = summary?.find((s) => s.status === "FAILED")?.count || 0;

  const formatClaimType = (type: string) =>
    type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-gray-400 mt-1">
          View collections, disbursals, and financial health
        </p>
      </div>

      {/* ── Financial Health Summary ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Collected</p>
              <p className="text-xl font-bold text-white">
                KES{" "}
                {financialLoading
                  ? "..."
                  : (
                      financialSummary?.collected.total || totalCompleted
                    ).toLocaleString()}
              </p>
              {financialSummary && (
                <p className="text-xs text-gray-500 mt-0.5">
                  This month: KES{" "}
                  {financialSummary.collected.thisMonth.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Disbursed</p>
              <p className="text-xl font-bold text-white">
                KES{" "}
                {financialLoading
                  ? "..."
                  : (financialSummary?.disbursed.total || 0).toLocaleString()}
              </p>
              {financialSummary && (
                <p className="text-xs text-gray-500 mt-0.5">
                  This month: KES{" "}
                  {financialSummary.disbursed.thisMonth.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Net Balance</p>
              <p
                className={`text-xl font-bold ${
                  (financialSummary?.netBalance || 0) >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                KES{" "}
                {financialLoading
                  ? "..."
                  : (financialSummary?.netBalance || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Collected − Disbursed
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <ArrowUpDown className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending / Failed</p>
              <p className="text-xl font-bold text-white">
                {totalPending}{" "}
                <span className="text-sm text-gray-500">/ {totalFailed}</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Pending / failed payments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-800 rounded-xl w-fit border border-gray-700">
        <button
          onClick={() => setActiveTab("collections")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "collections"
              ? "bg-emerald-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Collections (Incoming)
        </button>
        <button
          onClick={() => setActiveTab("disbursals")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "disbursals"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Disbursals (Outgoing)
          {financialSummary && financialSummary.recentDisbursals.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded-full">
              {financialSummary.recentDisbursals.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Collections Tab ──────────────────────────────── */}
      {activeTab === "collections" && (
        <>
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by reference or phone..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </form>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {(search || statusFilter || startDate || endDate) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Collections Table */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                          Reference
                        </th>
                        <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                          Member
                        </th>
                        <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                          Amount
                        </th>
                        <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                          Method
                        </th>
                        <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.data.map(
                        (payment: {
                          id: string;
                          paymentRef?: string;
                          amount: number;
                          paymentMethod: string;
                          status: string;
                          createdAt: string;
                          member?: {
                            fullName: string | null;
                            phoneNumber: string;
                          };
                        }) => (
                          <tr
                            key={payment.id}
                            className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <p className="text-white font-mono text-sm">
                                {payment.paymentRef || payment.id.slice(0, 8)}
                              </p>
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <p className="text-white">
                                  {payment.member?.fullName || "—"}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {payment.member?.phoneNumber}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-white font-medium">
                                KES {payment.amount.toLocaleString()}
                              </p>
                            </td>
                            <td className="py-4 px-6 text-gray-300">
                              {payment.paymentMethod}
                            </td>
                            <td className="py-4 px-6">
                              <StatusBadge status={payment.status} />
                            </td>
                            <td className="py-4 px-6 text-gray-500 text-sm">
                              {new Date(payment.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                {data?.data.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No payments found</p>
                  </div>
                )}

                {data && data.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
                    <div>
                      <p className="text-gray-500 text-sm">
                        Showing {(page - 1) * limit + 1} to{" "}
                        {Math.min(page * limit, data.meta.total)} of{" "}
                        {data.meta.total}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Filtered total: KES{" "}
                        {data.meta.totalAmount?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1 || isFetching}
                        className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-gray-400 text-sm px-2">
                        Page {page} of {data.meta.totalPages}
                      </span>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= data.meta.totalPages || isFetching}
                        className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ── Disbursals Tab ───────────────────────────────── */}
      {activeTab === "disbursals" && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {financialLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : financialSummary?.recentDisbursals.length === 0 ? (
            <div className="text-center py-16">
              <TrendingDown className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium">
                No disbursals yet
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Approved claims will appear here once disbursed
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Claim ID
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Member
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Type
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Amount
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Tx Ref
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Processed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {financialSummary?.recentDisbursals.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="text-white font-mono text-sm">
                          #{d.id.slice(-6)}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-white">{d.memberName}</p>
                          <p className="text-gray-500 text-sm">
                            {d.memberPhone}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300 text-sm">
                        {formatClaimType(d.claimType)}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-red-400 font-medium">
                          − KES {d.amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        {d.txHash ? (
                          <p className="text-blue-400 font-mono text-xs truncate max-w-[140px]">
                            {d.txHash}
                          </p>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-sm">
                        {d.processedAt
                          ? new Date(d.processedAt).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
