"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { getRemainingClaimLimit, formatClaimLimit } from "@/lib/claim-limits";
import Link from "next/link";
import {
  CreditCard,
  TrendingUp,
  FileText,
  MapPin,
  Calendar,
  ArrowRight,
  Wallet,
  Shield,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const tierColors = {
  BRONZE: "from-amber-600 to-amber-800",
  SILVER: "from-gray-400 to-gray-600",
  GOLD: "from-yellow-400 to-yellow-600",
};

const tierBg = {
  BRONZE: "bg-amber-50 border-amber-200",
  SILVER: "bg-gray-50 border-gray-200",
  GOLD: "bg-yellow-50 border-yellow-200",
};

export default function DashboardPage() {
  const member = useAuthStore((state) => state.member);
  const { t } = useTranslation();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getProfile(),
  });

  const { data: contributionSummary } = useQuery({
    queryKey: ["contribution-summary"],
    queryFn: () => api.getContributionSummary(),
  });

  const { data: claimsData } = useQuery({
    queryKey: ["claims"],
    queryFn: () => api.getMyClaims(),
  });

  const { data: upcomingCamps } = useQuery({
    queryKey: ["upcoming-camps"],
    queryFn: () => api.getUpcomingCamps(),
  });

  const subscription = profile?.subscription;
  const tier = subscription?.tier || "BRONZE";

  // Calculate correct remaining claim limit using centralized utility
  // CRITICAL: Only show claim limits for ACTIVE subscriptions
  const amountClaimed = claimsData?.summary?.amountClaimed || 0;
  const isSubscriptionActive = subscription?.isActive === true;
  const correctRemainingLimit =
    subscription?.tier && isSubscriptionActive
      ? getRemainingClaimLimit(subscription.tier, amountClaimed)
      : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-outfit">
            {t("dashboard.welcome", {
              name: member?.fullName?.split(" ")[0] || "Member",
            })}{" "}
            👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("dashboard.happeningDesc")}
          </p>
        </div>
        {subscription && subscription.isActive && (
          <div
            className={`px-4 py-2 rounded-full border ${tierBg[tier]} dark:bg-gray-800 dark:border-gray-700 flex items-center gap-2`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-gradient-to-r ${tierColors[tier]}`}
            />
            <span className="font-semibold text-gray-900 dark:text-white">
              {t("dashboard.tierMember", { tier })}
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats - 2x2 grid on mobile, 4 columns on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5 sm:w-6 sm:h-6" />}
          label={t("dashboard.totalContributed")}
          value={`KES ${(contributionSummary?.totalContributed || 0).toLocaleString()}`}
          color="emerald"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6" />}
          label={t("dashboard.monthsActive")}
          value={contributionSummary?.monthsContributed || 0}
          color="blue"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />}
          label={t("dashboard.claimsMade")}
          value={claimsData?.summary?.claimsUsed || 0}
          color="purple"
        />
        <StatCard
          icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6" />}
          label={t("dashboard.claimLimitLeft")}
          value={
            isSubscriptionActive
              ? `KES ${correctRemainingLimit.toLocaleString()}`
              : t("dashboard.pendingPayment")
          }
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Package Card */}
        <div className="lg:col-span-2">
          {subscription && subscription.isActive ? (
            <div
              className={`rounded-2xl p-6 bg-gradient-to-r ${tierColors[tier]} text-white shadow-lg`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm">
                    {t("dashboard.yourPackage")}
                  </p>
                  <h2 className="text-2xl font-bold mt-1">
                    {t("subscription.membership", { tier })}{" "}
                  </h2>
                  <p className="text-white/80 mt-2">
                    KES {subscription.monthlyAmount}
                    {t("subscription.perMonth")}
                  </p>
                </div>
                <CreditCard className="w-12 h-12 text-white/30" />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {subscription.benefits?.slice(0, 4).map((benefit, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white/20 rounded-full text-sm"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/dashboard/subscription"
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  {t("dashboard.managePackage")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {tier !== "GOLD" && (
                  <Link
                    href="/dashboard/subscription"
                    className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
                  >
                    {t("dashboard.upgrade")}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-6 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("dashboard.noSubscription")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {t("dashboard.noSubscriptionDesc")}
                </p>
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  {t("dashboard.viewPackages")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("dashboard.quickActions")}
          </h3>
          <QuickActionCard
            icon={<TrendingUp className="w-5 h-5" />}
            label={t("dashboard.makePayment")}
            description={t("dashboard.makePaymentDesc")}
            href="/dashboard/subscription"
          />
          <QuickActionCard
            icon={<FileText className="w-5 h-5" />}
            label={t("dashboard.submitClaim")}
            description={t("dashboard.submitClaimDesc")}
            href="/dashboard/claims"
          />
          <QuickActionCard
            icon={<MapPin className="w-5 h-5" />}
            label={t("dashboard.findClinic")}
            description={t("dashboard.findClinicDesc")}
            href="/dashboard/camps"
          />
        </div>
      </div>

      {/* Upcoming Camps */}
      {upcomingCamps && upcomingCamps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("dashboard.upcomingClinics")}
            </h3>
            <Link
              href="/dashboard/camps"
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
            >
              {t("dashboard.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingCamps.slice(0, 3).map((camp) => (
              <div
                key={camp.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {camp.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {camp.venue}
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
                      {new Date(camp.startDate).toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "emerald" | "blue" | "purple" | "orange";
}) {
  const colors = {
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    orange:
      "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-5 border border-gray-200 dark:border-gray-700">
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-2 sm:mb-3`}
      >
        {icon}
      </div>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
        {label}
      </p>
      <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1 truncate">
        {value}
      </p>
    </div>
  );
}

function QuickActionCard({
  icon,
  label,
  description,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all group"
    >
      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
    </Link>
  );
}
