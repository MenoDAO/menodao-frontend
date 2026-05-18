"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Users,
} from "lucide-react";
import { adminApi, type SubscriptionRow } from "@/lib/admin-api";

type SortField = "daysToExpiry" | "tier" | "startDate" | "renewalDate";
type SortOrder = "asc" | "desc";
type TierFilter = "ALL" | "BRONZE" | "SILVER" | "GOLD";
type StatusFilter = "all" | "active" | "inactive";

const TIER_COLORS: Record<string, string> = {
  BRONZE: "text-amber-400 bg-amber-400/10",
  SILVER: "text-slate-300 bg-slate-400/10",
  GOLD: "text-yellow-400 bg-yellow-400/10",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DaysChip({ days }: { days: number | null }) {
  if (days === null) return <span className="text-gray-500">—</span>;
  if (days < 0)
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
        Expired {Math.abs(days)}d ago
      </span>
    );
  if (days <= 7)
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
        {days}d
      </span>
    );
  if (days <= 30)
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
        {days}d
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
      {days}d
    </span>
  );
}

export function NotificationPanel() {
  // ── Subscription table state ──────────────────────────────────────────────
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [sortField, setSortField] = useState<SortField>("daysToExpiry");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [tierFilter, setTierFilter] = useState<TierFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

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

  // ── Load subscription table ───────────────────────────────────────────────
  const loadSubscriptions = useCallback(async () => {
    setTableLoading(true);
    setTableError("");
    try {
      const result = await adminApi.listSubscriptions({
        sortBy: sortField,
        order: sortOrder,
        tier: tierFilter,
        status: statusFilter,
        limit: 200,
      });
      setRows(result.data);
      setTotal(result.total);
    } catch (err) {
      setTableError(
        err instanceof Error ? err.message : "Failed to load subscriptions",
      );
    } finally {
      setTableLoading(false);
    }
  }, [sortField, sortOrder, tierFilter, statusFilter]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField)
      return <ChevronUp className="w-3 h-3 text-gray-600" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3 h-3 text-emerald-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-emerald-400" />
    );
  };

  // ── Reminder handlers ─────────────────────────────────────────────────────
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
      {/* ── Subscription Member Table ─────────────────────────────────────── */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              Member Subscriptions
            </h3>
            {!tableLoading && (
              <span className="text-xs text-gray-400 ml-1">
                ({total} members)
              </span>
            )}
          </div>
          <button
            onClick={loadSubscriptions}
            disabled={tableLoading}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${tableLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-700 bg-gray-800/50">
          {/* Tier filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Tier:</span>
            {(["ALL", "BRONZE", "SILVER", "GOLD"] as TierFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  tierFilter === t
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Status:</span>
            {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {tableError ? (
          <div className="flex items-center gap-2 p-6 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {tableError}
          </div>
        ) : tableLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">
            No subscriptions match the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    Member
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    <button
                      onClick={() => handleSort("tier")}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      Tier <SortIcon field="tier" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    Frequency
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    <button
                      onClick={() => handleSort("startDate")}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      First Subscribed <SortIcon field="startDate" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    <button
                      onClick={() => handleSort("renewalDate")}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      Next Renewal <SortIcon field="renewalDate" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    <button
                      onClick={() => handleSort("daysToExpiry")}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      Days to Expiry <SortIcon field="daysToExpiry" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {rows.map((row) => (
                  <tr
                    key={row.memberId}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[160px]">
                        {row.memberName ?? "—"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {row.phoneNumber ?? row.memberId.slice(0, 8) + "…"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIER_COLORS[row.tier] ?? ""}`}
                      >
                        {row.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 capitalize">
                      {row.paymentFrequency.toLowerCase()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.isActive
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-gray-600/40 text-gray-400"
                        }`}
                      >
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatDate(row.firstSubscriptionDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatDate(row.renewalDate)}
                    </td>
                    <td className="px-4 py-3">
                      <DaysChip days={row.daysToExpiry} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          within the specified number of days. Review the table above before
          sending.
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
