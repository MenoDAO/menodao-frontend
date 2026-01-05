"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-outfit">
            Welcome back, {member?.fullName?.split(" ")[0] || "Member"}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your membership
          </p>
        </div>
        {subscription && (
          <div className={`px-4 py-2 rounded-full border ${tierBg[tier]} flex items-center gap-2`}>
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${tierColors[tier]}`} />
            <span className="font-semibold text-gray-900">{tier} Member</span>
          </div>
        )}
      </div>

      {/* Quick Stats - 2x2 grid on mobile, 4 columns on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5 sm:w-6 sm:h-6" />}
          label="Total Contributed"
          value={`KES ${(contributionSummary?.totalContributed || 0).toLocaleString()}`}
          color="emerald"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6" />}
          label="Months Active"
          value={contributionSummary?.monthsContributed || 0}
          color="blue"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />}
          label="Claims Made"
          value={claimsData?.summary?.claimsUsed || 0}
          color="purple"
        />
        <StatCard
          icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6" />}
          label="Claim Limit Left"
          value={`KES ${(claimsData?.summary?.amountRemaining || 0).toLocaleString()}`}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Package Card */}
        <div className="lg:col-span-2">
          {subscription ? (
            <div className={`rounded-2xl p-6 bg-gradient-to-r ${tierColors[tier]} text-white shadow-lg`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm">Your Package</p>
                  <h2 className="text-2xl font-bold mt-1">{tier} Membership</h2>
                  <p className="text-white/80 mt-2">
                    KES {subscription.monthlyAmount}/month
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
                  Manage Package
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {tier !== "GOLD" && (
                  <Link
                    href="/dashboard/subscription"
                    className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
                  >
                    Upgrade
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-6 bg-gray-100 border-2 border-dashed border-gray-300">
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No Active Subscription</h3>
                <p className="text-gray-600 mt-2">
                  Subscribe to a package to start enjoying dental care benefits
                </p>
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  View Packages
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          <QuickActionCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Make Payment"
            description="Pay monthly contribution"
            href="/dashboard/subscription"
          />
          <QuickActionCard
            icon={<FileText className="w-5 h-5" />}
            label="Submit Claim"
            description="Request treatment benefit"
            href="/dashboard/claims"
          />
          <QuickActionCard
            icon={<MapPin className="w-5 h-5" />}
            label="Find Camp"
            description="Nearby dental camps"
            href="/dashboard/camps"
          />
        </div>
      </div>

      {/* Upcoming Camps */}
      {upcomingCamps && upcomingCamps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Upcoming Dental Camps</h3>
            <Link
              href="/dashboard/camps"
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingCamps.slice(0, 3).map((camp) => (
              <div
                key={camp.id}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{camp.name}</h4>
                    <p className="text-sm text-gray-500 truncate">{camp.venue}</p>
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
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-2 sm:mb-3`}>
        {icon}
      </div>
      <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
      <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1 truncate">{value}</p>
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
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all group"
    >
      <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
    </Link>
  );
}
