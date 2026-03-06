"use client";

import { useQuery } from "@tanstack/react-query";
import {
  adminApi,
  OverviewStats,
  RecentSignup,
  RecentPayment,
} from "@/lib/admin-api";
import { useAdminStore } from "@/lib/admin-store";
import { SMSMetrics } from "./components/SMSMetrics";
import {
  Users,
  CreditCard,
  TrendingUp,
  MessageSquare,
  Shield,
  Star,
  Crown,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: "up" | "down";
  trendValue?: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 bg-gray-700 rounded-lg">
          <Icon className="w-6 h-6 text-emerald-500" />
        </div>
      </div>
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1 text-sm">
          {trend === "up" ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          )}
          <span
            className={trend === "up" ? "text-emerald-500" : "text-red-500"}
          >
            {trendValue}
          </span>
          <span className="text-gray-500">vs last week</span>
        </div>
      )}
    </div>
  );
}

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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETED: "bg-emerald-500/20 text-emerald-400",
    PENDING: "bg-yellow-500/20 text-yellow-400",
    FAILED: "bg-red-500/20 text-red-400",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-gray-500/20 text-gray-400"}`}
    >
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const { admin } = useAdminStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats", "overview"],
    queryFn: () => adminApi.getOverviewStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentSignups, isLoading: signupsLoading } = useQuery({
    queryKey: ["admin", "recent-signups"],
    queryFn: () => adminApi.getRecentSignups(5),
  });

  const { data: recentPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin", "recent-payments"],
    queryFn: () => adminApi.getRecentPayments(5),
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back, {admin?.username}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={stats?.members.total.toLocaleString() || "0"}
          subtitle={`+${stats?.members.newThisMonth || 0} this month`}
          icon={Users}
          trend="up"
          trendValue={`+${stats?.members.newThisWeek || 0}`}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.subscriptions.active.toLocaleString() || "0"}
          subtitle={`${Math.round(((stats?.subscriptions.active || 0) / (stats?.members.total || 1)) * 100)}% of members`}
          icon={CreditCard}
        />
        <StatCard
          title="Revenue This Month"
          value={`KES ${(stats?.revenue.thisMonth || 0).toLocaleString()}`}
          subtitle={`Total: KES ${(stats?.revenue.total || 0).toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          title="SMS Sent Today"
          value={stats?.sms.today.toLocaleString() || "0"}
          subtitle={`${stats?.sms.thisMonth || 0} this month`}
          icon={MessageSquare}
        />
      </div>

      {/* SMS Metrics */}
      <SMSMetrics />

      {/* Subscription Tiers */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          Subscription Distribution
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-amber-400">Bronze</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats?.subscriptions.byTier.BRONZE || 0}
            </p>
            <p className="text-gray-400 text-sm">active members</p>
          </div>
          <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-300">Silver</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats?.subscriptions.byTier.SILVER || 0}
            </p>
            <p className="text-gray-400 text-sm">active members</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-yellow-400">Gold</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats?.subscriptions.byTier.GOLD || 0}
            </p>
            <p className="text-gray-400 text-sm">active members</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Signups</h2>
            <a
              href="/admin/users"
              className="text-emerald-500 text-sm hover:underline"
            >
              View all
            </a>
          </div>
          {signupsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {recentSignups?.map((user: RecentSignup) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">
                      {user.fullName || user.phoneNumber}
                    </p>
                    <p className="text-gray-500 text-sm">{user.phoneNumber}</p>
                  </div>
                  <div className="text-right">
                    {user.subscription ? (
                      <TierBadge tier={user.subscription.tier} />
                    ) : (
                      <span className="text-gray-500 text-xs">
                        No subscription
                      </span>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentSignups || recentSignups.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  No recent signups
                </p>
              )}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Recent Payments
            </h2>
            <a
              href="/admin/payments"
              className="text-emerald-500 text-sm hover:underline"
            >
              View all
            </a>
          </div>
          {paymentsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments?.map((payment: RecentPayment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">
                      KES {payment.amount.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {payment.member.fullName || payment.member.phoneNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={payment.status} />
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentPayments || recentPayments.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  No recent payments
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          Payment Status This Month
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-emerald-500/10 rounded-lg">
            <p className="text-3xl font-bold text-emerald-400">
              {stats?.payments.completedThisMonth || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Completed</p>
          </div>
          <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
            <p className="text-3xl font-bold text-yellow-400">
              {stats?.payments.pending || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Pending</p>
          </div>
          <div className="text-center p-4 bg-red-500/10 rounded-lg">
            <p className="text-3xl font-bold text-red-400">
              {stats?.payments.failedThisMonth || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Failed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
