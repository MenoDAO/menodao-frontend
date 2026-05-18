"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Users,
  AlertCircle,
  Loader2,
  Send,
  ChevronDown as ExpandIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
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

const SUBSCRIPTION_URL = "https://app.menodao.org/dashboard/subscription";

/** Generate a bilingual renewal reminder message based on member's preferred language */
function buildRenewalMessage(
  memberName: string | null,
  tier: string,
  renewalDate: string | null,
  lang: "en" | "sw" = "en",
): string {
  const name = memberName ?? "Member";
  const tierLabel = tier.charAt(0) + tier.slice(1).toLowerCase(); // e.g. "Bronze"
  const dateStr = renewalDate
    ? new Date(renewalDate).toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "soon";

  if (lang === "sw") {
    return (
      `Habari ${name}! Ukumbusho wa upya wa usajili wako wa MenoDAO ${tierLabel}. ` +
      `Usajili wako unakaribia kumalizika tarehe ${dateStr}. ` +
      `Tafadhali fanya upya sasa ili kuendelea kupata huduma za meno: ${SUBSCRIPTION_URL} ` +
      `Asante kwa kuwa sehemu ya MenoDAO! 🦷`
    );
  }
  return (
    `Hi ${name}! This is a friendly reminder about your MenoDAO ${tierLabel} subscription renewal. ` +
    `Your subscription is due for renewal on ${dateStr}. ` +
    `Please renew now to continue enjoying your dental benefits: ${SUBSCRIPTION_URL} ` +
    `Thank you for being part of MenoDAO! 🦷`
  );
}

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

const MOBILE_INITIAL_ROWS = 3;

export function SubscriptionTable() {
  const router = useRouter();

  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [sortField, setSortField] = useState<SortField>("daysToExpiry");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [tierFilter, setTierFilter] = useState<TierFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [showAll, setShowAll] = useState(false);
  // Track which row's Alert button is in-flight to prevent double clicks
  const [alertingId, setAlertingId] = useState<string | null>(null);
  const [bulkAlerting, setBulkAlerting] = useState(false);

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

  /** Navigate to send-notification pre-filled for a single member */
  const handleSendAlertToMember = (row: SubscriptionRow) => {
    if (!row.phoneNumber || alertingId) return;
    setAlertingId(row.memberId);
    const message = buildRenewalMessage(
      row.memberName,
      row.tier,
      row.renewalDate,
      "en", // default; admin can edit before sending
    );
    const params = new URLSearchParams({
      phone: row.phoneNumber,
      message,
    });
    router.push(`/admin/alerts/send?${params.toString()}`);
    // Reset after navigation (small delay so button stays disabled during nav)
    setTimeout(() => setAlertingId(null), 2000);
  };

  /** Navigate to send-notification with the full filtered phone list pre-populated */
  const handleSendAlertToFiltered = () => {
    if (bulkAlerting || rows.length === 0) return;
    setBulkAlerting(true);

    const phones = rows
      .filter((r) => r.phoneNumber)
      .map((r) => r.phoneNumber as string);

    // Build a generic bulk renewal message
    const message =
      `Hi! This is a renewal reminder for your MenoDAO subscription. ` +
      `Please renew to continue enjoying your dental benefits: ${SUBSCRIPTION_URL} 🦷`;

    const params = new URLSearchParams({
      phones: phones.join(","),
      message,
    });
    router.push(`/admin/alerts/send?${params.toString()}`);
    setTimeout(() => setBulkAlerting(false), 2000);
  };

  const visibleRows = showAll ? rows : rows.slice(0, MOBILE_INITIAL_ROWS);

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-700 gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400 shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold text-white">
            Member Subscriptions
          </h3>
          {!tableLoading && (
            <span className="text-xs text-gray-400">({total})</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSendAlertToFiltered}
            disabled={tableLoading || rows.length === 0 || bulkAlerting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {bulkAlerting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Send Alert to Filtered</span>
            <span className="sm:hidden">Alert All</span>
            <span>({total})</span>
          </button>
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
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400">Tier:</span>
          {(["ALL", "BRONZE", "SILVER", "GOLD"] as TierFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                tierFilter === t
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400">Status:</span>
          {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize transition-colors ${
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

      {/* Content */}
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
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
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
                  <th className="px-4 py-3 text-gray-400 font-medium">Freq.</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">
                    <button
                      onClick={() => handleSort("startDate")}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      First Sub <SortIcon field="startDate" />
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
                      Expiry <SortIcon field="daysToExpiry" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {rows.map((row) => (
                  <tr
                    key={row.memberId}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[140px]">
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
                    <td className="px-4 py-3 text-gray-300 capitalize text-xs">
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
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {formatDate(row.firstSubscriptionDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {formatDate(row.renewalDate)}
                    </td>
                    <td className="px-4 py-3">
                      <DaysChip days={row.daysToExpiry} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSendAlertToMember(row)}
                        disabled={
                          !row.phoneNumber || alertingId === row.memberId
                        }
                        title={
                          row.phoneNumber
                            ? `Send alert to ${row.phoneNumber}`
                            : "No phone number"
                        }
                        className="flex items-center gap-1 px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/40 disabled:opacity-40 disabled:cursor-not-allowed text-purple-300 text-xs font-medium rounded-lg transition-colors"
                      >
                        {alertingId === row.memberId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Alert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-700/50">
            {visibleRows.map((row) => (
              <div
                key={row.memberId}
                className="px-4 py-3 hover:bg-gray-700/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {row.memberName ?? "—"}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {row.phoneNumber ?? row.memberId.slice(0, 8) + "…"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSendAlertToMember(row)}
                    disabled={!row.phoneNumber || alertingId === row.memberId}
                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/40 disabled:opacity-40 disabled:cursor-not-allowed text-purple-300 text-xs font-medium rounded-lg transition-colors shrink-0"
                  >
                    {alertingId === row.memberId ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    Alert
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIER_COLORS[row.tier] ?? ""}`}
                  >
                    {row.tier}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      row.isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-gray-600/40 text-gray-400"
                    }`}
                  >
                    {row.isActive ? "Active" : "Inactive"}
                  </span>
                  <DaysChip days={row.daysToExpiry} />
                  <span className="text-gray-500 text-xs">
                    Renews {formatDate(row.renewalDate)}
                  </span>
                </div>
              </div>
            ))}

            {/* Show more / less */}
            {rows.length > MOBILE_INITIAL_ROWS && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 py-3 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                <ExpandIcon
                  className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`}
                />
                {showAll
                  ? "Show less"
                  : `Show ${rows.length - MOBILE_INITIAL_ROWS} more`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
