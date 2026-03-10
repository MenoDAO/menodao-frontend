"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi, AuditLogEntry } from "@/lib/admin-api";
import { ClipboardList, Loader2, AlertCircle } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  SUSPEND_MEMBER: "Suspended member",
  DEACTIVATE_SUBSCRIPTION: "Deactivated subscription",
  VERIFY_PAYMENT: "Verified payment",
  SYNC_PAYMENT_STATUS: "Synced payment status",
};

const TARGET_COLORS: Record<string, string> = {
  MEMBER: "text-blue-400",
  SUBSCRIPTION: "text-purple-400",
  PAYMENT: "text-amber-400",
  DISBURSAL: "text-emerald-400",
};

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function AuditLog({ limit = 20 }: { limit?: number }) {
  const {
    data: logs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "audit-logs", limit],
    queryFn: () => adminApi.getAuditLogs(limit),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Failed to load audit logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-white">Activity Log</h2>
      </div>

      {!logs || logs.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">
          No admin actions recorded yet
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.map((log: AuditLogEntry) => (
            <div
              key={log.id}
              className="flex items-start gap-3 py-2 border-b border-gray-700/50 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-semibold text-xs">
                  {log.admin?.username?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  <span className="font-medium text-emerald-400">
                    {log.admin?.username || "Unknown"}
                  </span>{" "}
                  {ACTION_LABELS[log.action] ||
                    log.action.toLowerCase().replace(/_/g, " ")}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs ${TARGET_COLORS[log.targetType] || "text-gray-400"}`}
                  >
                    {log.targetType}
                  </span>
                  <span className="text-xs text-gray-500">
                    {log.targetId.substring(0, 8)}...
                  </span>
                </div>
                {log.reason && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    Reason: {log.reason}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatRelativeTime(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
