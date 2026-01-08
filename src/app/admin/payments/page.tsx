"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETED: "bg-emerald-500/20 text-emerald-400",
    PENDING: "bg-yellow-500/20 text-yellow-400",
    FAILED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-purple-500/20 text-purple-400",
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-gray-500/20 text-gray-400"}`}>
      {status}
    </span>
  );
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "payments", page, search, statusFilter, startDate, endDate],
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

  // Calculate summary totals
  const totalCompleted = summary?.find((s) => s.status === "COMPLETED")?.totalAmount || 0;
  const totalPending = summary?.find((s) => s.status === "PENDING")?.count || 0;
  const totalFailed = summary?.find((s) => s.status === "FAILED")?.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-gray-400 mt-1">View and manage all payment transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-xl font-bold text-white">
                KES {totalCompleted.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending Payments</p>
              <p className="text-xl font-bold text-white">{totalPending}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Failed Payments</p>
              <p className="text-xl font-bold text-white">{totalFailed}</p>
            </div>
          </div>
        </div>
      </div>

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

      {/* Table */}
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
                  {data?.data.map((payment: any) => (
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {data?.data.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No payments found</p>
              </div>
            )}

            {/* Pagination */}
            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
                <div>
                  <p className="text-gray-500 text-sm">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, data.meta.total)} of {data.meta.total}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Filtered total: KES {data.meta.totalAmount?.toLocaleString() || 0}
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
    </div>
  );
}
