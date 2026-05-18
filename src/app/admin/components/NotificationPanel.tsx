"use client";

import { useState } from "react";
import { Bell, Send, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export function NotificationPanel() {
  // ── Single member reminder state ──────────────────────────────────────────
  const [memberId, setMemberId] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberSuccess, setMemberSuccess] = useState<{
    phoneNumber: string;
    templateKey: string;
  } | null>(null);
  const [memberError, setMemberError] = useState("");

  // ── Bulk reminder state ───────────────────────────────────────────────────
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(7);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState<{
    triggered: number;
    skipped: number;
    failed: number;
  } | null>(null);
  const [bulkError, setBulkError] = useState("");

  const handleSendMemberReminder = async () => {
    if (!memberId.trim()) return;
    setMemberLoading(true);
    setMemberSuccess(null);
    setMemberError("");
    try {
      const result = await adminApi.triggerMemberReminder(memberId.trim());
      setMemberSuccess(result);
    } catch (err) {
      setMemberError(
        err instanceof Error ? err.message : "Failed to send reminder",
      );
    } finally {
      setMemberLoading(false);
    }
  };

  const handleSendBulkReminder = async () => {
    setBulkLoading(true);
    setBulkSuccess(null);
    setBulkError("");
    try {
      const result = await adminApi.triggerBulkReminder(daysUntilExpiry);
      setBulkSuccess(result);
    } catch (err) {
      setBulkError(
        err instanceof Error ? err.message : "Failed to send bulk reminders",
      );
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Single Member Reminder ────────────────────────────────────────── */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-white">
            Send Reminder to Member
          </h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Manually trigger a renewal reminder SMS for a specific member.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="Member ID"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleSendMemberReminder}
            disabled={memberLoading || !memberId.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {memberLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Reminder
          </button>
        </div>
        {memberSuccess && (
          <div className="mt-3 flex items-start gap-2 text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Reminder sent to <strong>{memberSuccess.phoneNumber}</strong>{" "}
              using template <strong>{memberSuccess.templateKey}</strong>.
            </span>
          </div>
        )}
        {memberError && (
          <div className="mt-3 flex items-start gap-2 text-sm text-red-300 bg-red-900/20 border border-red-700/50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{memberError}</span>
          </div>
        )}
      </div>

      {/* ── Bulk Reminder ─────────────────────────────────────────────────── */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">
            Send Bulk Reminders
          </h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Send renewal reminders to all members whose subscriptions expire
          within the specified number of days. View the full subscription list
          under{" "}
          <a
            href="/admin/users"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Users → Subscription Details
          </a>
          .
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Days Until Expiry (1–30)
            </label>
            <input
              type="number"
              value={daysUntilExpiry}
              onChange={(e) =>
                setDaysUntilExpiry(
                  Math.min(30, Math.max(1, Number(e.target.value))),
                )
              }
              min={1}
              max={30}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={handleSendBulkReminder}
            disabled={bulkLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {bulkLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send to All Expiring
          </button>
        </div>
        {bulkSuccess && (
          <div className="mt-3 flex items-start gap-2 text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Reminders sent: <strong>{bulkSuccess.triggered}</strong>{" "}
              triggered, <strong>{bulkSuccess.skipped}</strong> skipped (already
              sent today), <strong>{bulkSuccess.failed}</strong> failed.
            </span>
          </div>
        )}
        {bulkError && (
          <div className="mt-3 flex items-start gap-2 text-sm text-red-300 bg-red-900/20 border border-red-700/50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{bulkError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
