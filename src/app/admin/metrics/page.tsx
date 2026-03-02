"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, SiteVisitMetrics } from "@/lib/admin-api";
import {
  BarChart3,
  Eye,
  Users,
  TrendingUp,
  Globe,
  Loader2,
  Calendar,
} from "lucide-react";

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${accent}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function BarChart({
  data,
  maxHeight = 160,
}: {
  data: { date: string; count: number }[];
  maxHeight?: number;
}) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-8">No visit data yet</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div
      className="flex items-end gap-1 overflow-x-auto pb-2"
      style={{ minHeight: maxHeight + 40 }}
    >
      {data.map((d, i) => {
        const height = Math.max((d.count / maxCount) * maxHeight, 4);
        const dateStr = new Date(d.date).toLocaleDateString("en-KE", {
          month: "short",
          day: "numeric",
        });
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1 flex-1 min-w-[28px] group"
          >
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {d.count}
            </span>
            <div
              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all hover:from-emerald-500 hover:to-emerald-300"
              style={{ height: `${height}px` }}
              title={`${dateStr}: ${d.count} visits`}
            />
            <span className="text-[10px] text-gray-500 truncate w-full text-center">
              {data.length <= 14 ? dateStr : i % 3 === 0 ? dateStr : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RankTable({
  title,
  icon: Icon,
  data,
  labelKey,
  emptyLabel,
}: {
  title: string;
  icon: React.ElementType;
  data: { count: number; [key: string]: string | number }[];
  labelKey: string;
  emptyLabel: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-gray-500 text-center py-4">{emptyLabel}</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-emerald-500" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-300 truncate max-w-[70%]">
                {String(item[labelKey]) || "(direct)"}
              </span>
              <span className="text-gray-400 font-medium">{item.count}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MetricsPage() {
  const [days, setDays] = useState(30);

  const { data: metrics, isLoading } = useQuery<SiteVisitMetrics>({
    queryKey: ["admin", "site-visits", days],
    queryFn: () => adminApi.getSiteVisitMetrics(days),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Metrics</h1>
          <p className="text-gray-400 mt-1">
            Landing page visit analytics &amp; traffic sources
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg border border-gray-700 p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                days === opt.value
                  ? "bg-emerald-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Visits"
          value={metrics?.summary.totalVisits.toLocaleString() || "0"}
          icon={Eye}
          accent="bg-blue-600"
        />
        <StatCard
          title="Unique Sessions"
          value={metrics?.summary.uniqueSessions.toLocaleString() || "0"}
          icon={Users}
          accent="bg-purple-600"
        />
        <StatCard
          title="Today's Visits"
          value={metrics?.summary.todayVisits.toLocaleString() || "0"}
          icon={TrendingUp}
          accent="bg-emerald-600"
        />
        <StatCard
          title="Top Source"
          value={
            metrics?.topUtmSources?.[0]?.source ||
            metrics?.topReferrers?.[0]?.referrer
              ?.replace(/https?:\/\//, "")
              .split("/")[0] ||
            "Direct"
          }
          icon={Globe}
          accent="bg-orange-600"
        />
      </div>

      {/* Visits per day chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">Visits Over Time</h2>
          <span className="text-gray-500 text-sm ml-auto">
            <Calendar className="w-4 h-4 inline mr-1" />
            Last {days} days
          </span>
        </div>
        <BarChart data={metrics?.visitsPerDay || []} />
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankTable
          title="Top Referrers"
          icon={Globe}
          data={metrics?.topReferrers || []}
          labelKey="referrer"
          emptyLabel="No referrer data yet"
        />
        <RankTable
          title="UTM Sources"
          icon={TrendingUp}
          data={metrics?.topUtmSources || []}
          labelKey="source"
          emptyLabel="No UTM sources tracked yet"
        />
        <RankTable
          title="Campaigns"
          icon={BarChart3}
          data={metrics?.topUtmCampaigns || []}
          labelKey="campaign"
          emptyLabel="No campaigns tracked yet"
        />
        <RankTable
          title="Top Pages"
          icon={Eye}
          data={metrics?.topPages || []}
          labelKey="page"
          emptyLabel="No page data yet"
        />
      </div>

      {/* UTM parameter info */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          How to Track Campaign Sources
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Add UTM parameters to your shared links to track marketing
          effectiveness. Example:{" "}
          <code className="bg-gray-700 text-emerald-400 px-2 py-0.5 rounded text-xs break-all">
            menodao.org?utm_source=whatsapp&amp;utm_medium=social&amp;utm_campaign=launch
          </code>
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-emerald-400 text-xs font-semibold mb-1">
              utm_source
            </p>
            <p className="text-gray-400 text-xs">
              Where traffic comes from (e.g. whatsapp, twitter, flyer)
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-emerald-400 text-xs font-semibold mb-1">
              utm_medium
            </p>
            <p className="text-gray-400 text-xs">
              Marketing medium (e.g. social, email, print)
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-emerald-400 text-xs font-semibold mb-1">
              utm_campaign
            </p>
            <p className="text-gray-400 text-xs">
              Campaign name (e.g. launch, february-promo)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
