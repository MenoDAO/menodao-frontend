"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, NotificationRecord } from "@/lib/admin-api";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  Filter,
} from "lucide-react";

export function NotificationHistory() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const {
    data: history,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "admin",
      "notifications",
      "history",
      page,
      pageSize,
      typeFilter,
      statusFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      adminApi.getNotificationHistoryV2({
        page,
        pageSize,
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getTypeIcon = (type: string) => {
    return type === "SMS" ? (
      <MessageSquare className="w-4 h-4" />
    ) : (
      <Bell className="w-4 h-4" />
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "SENT":
        return <Send className="w-4 h-4 text-blue-500" />;
      case "PARTIAL":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "text-emerald-400";
      case "FAILED":
        return "text-red-400";
      case "PENDING":
        return "text-yellow-400";
      case "SENT":
        return "text-blue-400";
      case "PARTIAL":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  const calculateDeliveryRate = (notification: NotificationRecord) => {
    const { successCount, failureCount } = notification.deliveryStats;
    const total = successCount + failureCount;
    if (total === 0) return "N/A";
    const rate = (successCount / total) * 100;
    return `${rate.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <Loader2
            className="w-6 h-6 animate-spin text-emerald-500"
            role="status"
            aria-label="Loading notification history"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Failed to load notification history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">
          Notification History
        </h2>
        {history && (
          <p className="text-gray-400 text-sm">
            {history.total} total notification{history.total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label
              htmlFor="type-filter"
              className="block text-xs text-gray-400 mb-1.5"
            >
              Notification Type
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1); // Reset to first page when filter changes
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status-filter"
              className="block text-xs text-gray-400 mb-1.5"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1); // Reset to first page when filter changes
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>

          {/* Date From Filter */}
          <div>
            <label
              htmlFor="date-from"
              className="block text-xs text-gray-400 mb-1.5"
            >
              From Date
            </label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1); // Reset to first page when filter changes
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label
              htmlFor="date-to"
              className="block text-xs text-gray-400 mb-1.5"
            >
              To Date
            </label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1); // Reset to first page when filter changes
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(typeFilter || statusFilter || dateFrom || dateTo) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setTypeFilter("");
                setStatusFilter("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">
                Type
              </th>
              <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">
                Recipients
              </th>
              <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">
                Message
              </th>
              <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">
                Status
              </th>
              <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">
                Delivery Rate
              </th>
              <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">
                Sent At
              </th>
              <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">
                Sent By
              </th>
            </tr>
          </thead>
          <tbody>
            {history?.notifications.map((notification) => (
              <tr
                key={notification.id}
                className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(notification.type)}
                    <span className="text-white text-sm">
                      {notification.type}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-white text-sm">
                    {notification.recipientCount.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <p className="text-gray-300 text-sm max-w-xs truncate">
                    {notification.message}
                  </p>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(notification.status)}
                    <span
                      className={`text-sm ${getStatusColor(notification.status)}`}
                    >
                      {notification.status}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm">
                    <span className="text-white font-medium">
                      {calculateDeliveryRate(notification)}
                    </span>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {notification.deliveryStats.successCount}/
                      {notification.deliveryStats.successCount +
                        notification.deliveryStats.failureCount}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm">
                    <p className="text-white">
                      {formatDate(notification.sentAt)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatTime(notification.sentAt)}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-gray-300 text-sm">
                    {notification.sentBy}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!history?.notifications || history.notifications.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notifications sent yet</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {history && history.total > pageSize && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, history.total)} of {history.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-400 text-sm px-3">
              Page {page} of {Math.ceil(history.total / pageSize)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(history.total / pageSize)}
              className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
