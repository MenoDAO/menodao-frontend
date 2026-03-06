"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { MessageSquare, Loader2, AlertCircle } from "lucide-react";

export function SMSMetrics() {
  const {
    data: smsStats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "notifications", "sms-stats"],
    queryFn: () => adminApi.getSMSStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <Loader2
            className="w-6 h-6 animate-spin text-emerald-500"
            role="status"
            aria-label="Loading SMS metrics"
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
          <p className="text-sm">Failed to load SMS metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-white">SMS Usage</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">SMS sent today</p>
          <p className="text-3xl font-bold text-white">
            {smsStats?.todayCount.toLocaleString() || "0"}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total SMS sent</p>
          <p className="text-3xl font-bold text-white">
            {smsStats?.allTimeCount.toLocaleString() || "0"}
          </p>
        </div>
      </div>
    </div>
  );
}
