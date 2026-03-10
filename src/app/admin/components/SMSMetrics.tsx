"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { MessageSquare, Loader2, AlertCircle, TrendingUp } from "lucide-react";

export function SMSMetrics() {
  const {
    data: smsMetrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "stats", "sms-metrics"],
    queryFn: () => adminApi.getSmsMetrics(30),
    refetchInterval: 30000,
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

  // Find max count for chart scaling
  const maxCount = Math.max(
    1,
    ...(smsMetrics?.dailyBreakdown?.map((d) => d.count) || [1]),
  );

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-white">SMS Usage</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-1">Today</p>
          <p className="text-2xl font-bold text-white">
            {smsMetrics?.todayCount.toLocaleString() || "0"}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-1">All Time</p>
          <p className="text-2xl font-bold text-white">
            {smsMetrics?.allTimeTotal.toLocaleString() || "0"}
          </p>
        </div>
        {smsMetrics?.byStatus?.map((s) => (
          <div key={s.status} className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">{s.status}</p>
            <p className="text-2xl font-bold text-white">
              {s.count.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <p className="text-sm text-gray-400">Daily SMS (Last 30 days)</p>
        </div>
        <div className="flex items-end gap-[2px] h-32">
          {smsMetrics?.dailyBreakdown?.map((day) => {
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            return (
              <div
                key={day.date}
                className="flex-1 group relative"
                title={`${day.date}: ${day.count} SMS`}
              >
                <div
                  className="bg-emerald-500/70 hover:bg-emerald-400 rounded-t transition-colors w-full"
                  style={{
                    height: `${Math.max(height, 2)}%`,
                  }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap border border-gray-600">
                    {day.date}: {day.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            {smsMetrics?.dailyBreakdown?.[0]?.date || ""}
          </span>
          <span className="text-xs text-gray-500">
            {smsMetrics?.dailyBreakdown?.[smsMetrics.dailyBreakdown.length - 1]
              ?.date || ""}
          </span>
        </div>
      </div>
    </div>
  );
}
