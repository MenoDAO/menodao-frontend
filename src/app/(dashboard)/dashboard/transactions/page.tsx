"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import {
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Filter,
  Receipt,
} from "lucide-react";

type ActivityType = "CONTRIBUTION" | "TREATMENT_PAYMENT";
type ActivityFilter = "all" | ActivityType;

interface ActivityItem {
  id: string;
  type: ActivityType;
  amount: number;
  status: string;
  date: string;
}

const ITEMS_PER_PAGE = 20;

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  DISBURSED: "bg-emerald-100 text-emerald-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  FAILED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-600",
};

const ACTIVITY_FILTERS: ActivityFilter[] = [
  "all",
  "CONTRIBUTION",
  "TREATMENT_PAYMENT",
];

function activityTypeLabel(type: ActivityType, t: (key: string) => string) {
  return type === "CONTRIBUTION"
    ? t("activity.colContribution")
    : t("activity.colTreatmentPayment");
}

function ActivityTypeIcon({ type }: { type: ActivityType }) {
  return type === "CONTRIBUTION" ? (
    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
  ) : (
    <ArrowDownRight className="w-4 h-4 text-blue-500" />
  );
}

export default function TransactionsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [page, setPage] = useState(1);

  const contributionsQuery = useQuery({
    queryKey: ["contributions-activity"],
    queryFn: async () => {
      const first = await api.getContributions(1, 100);
      const all = [...first.data];
      let currentPage = 1;
      while (currentPage < first.meta.totalPages) {
        currentPage += 1;
        const next = await api.getContributions(currentPage, 100);
        all.push(...next.data);
      }
      return all;
    },
  });

  const claimsQuery = useQuery({
    queryKey: ["claims-activity"],
    queryFn: () => api.getMyClaims(),
  });

  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    for (const contribution of contributionsQuery.data ?? []) {
      items.push({
        id: `contribution-${contribution.id}`,
        type: "CONTRIBUTION",
        amount: contribution.amount,
        status: contribution.status,
        date: contribution.createdAt,
      });
    }

    for (const claim of claimsQuery.data?.claims ?? []) {
      if (!["DISBURSED", "PROCESSING", "APPROVED"].includes(claim.status)) {
        continue;
      }
      items.push({
        id: `claim-${claim.id}`,
        type: "TREATMENT_PAYMENT",
        amount: claim.amount,
        status: claim.status,
        date: claim.processedAt ?? claim.createdAt,
      });
    }

    return items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [contributionsQuery.data, claimsQuery.data]);

  const filteredActivities =
    filter === "all"
      ? activities
      : activities.filter((item) => item.type === filter);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredActivities.length / ITEMS_PER_PAGE),
  );
  const pageItems = filteredActivities.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const isLoading = contributionsQuery.isLoading || claimsQuery.isLoading;
  const isError = contributionsQuery.isError || claimsQuery.isError;

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t("nav.activity")}
        </h1>
        <p className="text-gray-600 mt-1">{t("activity.pageSubtitle")}</p>
      </div>

      <section>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {ACTIVITY_FILTERS.map((f) => {
            const label =
              f === "all"
                ? t("activity.filterAll")
                : f === "CONTRIBUTION"
                  ? t("activity.filterContribution")
                  : t("activity.filterTreatmentPayment");
            return (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {t("common.error")}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {t("activity.noActivityTitle")}
            </h3>
            <p className="text-gray-500 text-sm">
              {t("activity.noActivityDesc")}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("activity.colType")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("activity.colDate")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("activity.colStatus")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("activity.colAmount")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ActivityTypeIcon type={item.type} />
                          <span className="text-sm text-gray-700">
                            {activityTypeLabel(item.type, t)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        KES {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {t("common.previous")}
            </button>
            <span className="text-sm text-gray-600">
              {t("common.page", { page, total: totalPages })}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
