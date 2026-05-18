"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, AdminUser } from "@/lib/admin-api";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Star,
  Crown,
  Check,
  X,
  Trash2,
} from "lucide-react";

import { useEffect } from "react";
import { SubscriptionTable } from "../components/SubscriptionTable";

function TierBadge({ tier }: { tier: string }) {
  const colors = {
    BRONZE: "bg-amber-500/20 text-amber-400",
    SILVER: "bg-gray-500/20 text-gray-300",
    GOLD: "bg-yellow-500/20 text-yellow-400",
  };
  const icons = {
    BRONZE: Shield,
    SILVER: Star,
    GOLD: Crown,
  };
  const Icon = icons[tier as keyof typeof icons] || Shield;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors[tier as keyof typeof colors] || "bg-gray-500/20 text-gray-400"}`}
    >
      <Icon className="w-3 h-3" />
      {tier}
    </span>
  );
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "users", page, search, tierFilter],
    queryFn: () =>
      adminApi.listUsers({
        page,
        limit,
        search: search || undefined,
        tier: tierFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (memberId: string) => adminApi.deleteSubscription(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setToast({
        message: "Subscription removed successfully",
        type: "success",
      });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      setToast({
        message: error.message || "Failed to remove subscription",
        type: "error",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 mt-1">Manage all registered members</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by phone or name..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </form>
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Tiers</option>
          <option value="BRONZE">Bronze</option>
          <option value="SILVER">Silver</option>
          <option value="GOLD">Gold</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      User
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Subscription
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Contributions
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Claims
                    </th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((user: AdminUser) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-white font-medium">
                            {user.fullName || "—"}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {user.phoneNumber}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {user.subscription ? (
                          <div>
                            <TierBadge tier={user.subscription.tier} />
                            <p className="text-gray-500 text-xs mt-1">
                              KES {user.subscription.monthlyAmount}/mo
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-2">
                          {user.subscription?.isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                              <Check className="w-4 h-4" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
                              <X className="w-4 h-4" />
                              Inactive
                            </span>
                          )}
                          {user.subscription && (
                            <div className="flex items-center gap-2">
                              {deleteConfirmId === user.id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      deleteMutation.mutate(user.id)
                                    }
                                    disabled={deleteMutation.isPending}
                                    className="text-xs font-semibold text-red-500 hover:text-red-400"
                                  >
                                    {deleteMutation.isPending
                                      ? "Removing..."
                                      : "Confirm"}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="text-xs font-semibold text-gray-400 hover:text-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(user.id)}
                                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-400 transition-colors"
                                  title="Remove Subscription"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {user._count.contributions}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {user._count.claims}
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards — show 3 rows with "Show more" */}
            <div className="sm:hidden divide-y divide-gray-700/50">
              {(showAllUsers
                ? (data?.data ?? [])
                : (data?.data ?? []).slice(0, 3)
              ).map((user: AdminUser) => (
                <div key={user.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {user.fullName || "—"}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {user.phoneNumber}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {user.subscription ? (
                        <TierBadge tier={user.subscription.tier} />
                      ) : (
                        <span className="text-gray-500 text-xs">No sub</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                    {user.subscription?.isActive ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center gap-0.5">
                        <X className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                    <span>{user._count.contributions} payments</span>
                    <span>{user._count.claims} claims</span>
                    <span>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {(data?.data?.length ?? 0) > 3 && (
                <button
                  onClick={() => setShowAllUsers((v) => !v)}
                  className="w-full flex items-center justify-center gap-1.5 py-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${showAllUsers ? "rotate-90" : ""}`}
                  />
                  {showAllUsers
                    ? "Show less"
                    : `Show ${(data?.data?.length ?? 0) - 3} more`}
                </button>
              )}
            </div>

            {/* Empty state */}
            {data?.data.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}

            {/* Pagination */}
            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-700">
                <p className="text-gray-500 text-xs sm:text-sm">
                  {(page - 1) * limit + 1}–
                  {Math.min(page * limit, data.meta.total)} of {data.meta.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1 || isFetching}
                    className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-gray-400 text-sm px-2">
                    {page}/{data.meta.totalPages}
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
      {/* Subscription details table */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Subscription Details
        </h2>
        <SubscriptionTable />
      </div>
    </div>
  );
}
