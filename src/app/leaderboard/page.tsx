"use client";

import { useQuery } from "@tanstack/react-query";
import { api, LeaderboardEntry } from "@/lib/api";
import { Trophy, Medal, Users, TrendingUp } from "lucide-react";

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded-2xl" />
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-white font-bold text-sm">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-white font-bold text-sm">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-sm">
        🥉
      </span>
    );
  return (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
      {rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api.getLeaderboard(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Champion Leaderboard
            </h1>
          </div>
          <p className="text-gray-500 text-lg">Top MenoDAO Champions</p>
        </div>

        {isLoading ? (
          <Skeleton />
        ) : !entries || entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Medal className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg">No champions yet. Be the first!</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-50 border-b border-emerald-100">
                    <th className="text-left py-4 px-5 text-emerald-700 font-semibold">
                      #
                    </th>
                    <th className="text-left py-4 px-5 text-emerald-700 font-semibold">
                      First Name
                    </th>
                    <th className="text-left py-4 px-5 text-emerald-700 font-semibold">
                      Referral Code
                    </th>
                    <th className="text-right py-4 px-5 text-emerald-700 font-semibold">
                      <span className="flex items-center justify-end gap-1">
                        <TrendingUp className="w-4 h-4" /> Active
                      </span>
                    </th>
                    <th className="text-right py-4 px-5 text-emerald-700 font-semibold">
                      <span className="flex items-center justify-end gap-1">
                        <Users className="w-4 h-4" /> Total
                      </span>
                    </th>
                    <th className="text-left py-4 px-5 text-emerald-700 font-semibold">
                      Member Since
                    </th>
                    <th className="text-right py-4 px-5 text-emerald-700 font-semibold">
                      Total Earned (KES)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: LeaderboardEntry) => (
                    <tr
                      key={entry.referralCode}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${entry.rank <= 3 ? "bg-yellow-50/30" : ""}`}
                    >
                      <td className="py-4 px-5">
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td className="py-4 px-5 font-semibold text-gray-900">
                        {entry.firstName}
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg">
                          {entry.referralCode}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-emerald-600">
                        {entry.activeReferrals}
                      </td>
                      <td className="py-4 px-5 text-right text-gray-600">
                        {entry.totalReferrals}
                      </td>
                      <td className="py-4 px-5 text-gray-500 text-xs">
                        {new Date(entry.memberSince).toLocaleDateString(
                          "en-KE",
                          {
                            year: "numeric",
                            month: "short",
                          },
                        )}
                      </td>
                      <td className="py-4 px-5 text-right font-semibold text-gray-900">
                        {entry.totalCommissionsEarned.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {entries.map((entry: LeaderboardEntry) => (
                <div
                  key={entry.referralCode}
                  className={`rounded-2xl border p-4 bg-white shadow-sm ${entry.rank <= 3 ? "border-yellow-300" : "border-gray-200"}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <RankBadge rank={entry.rank} />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">
                        {entry.firstName}
                      </p>
                      <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        {entry.referralCode}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Earned</p>
                      <p className="font-bold text-gray-900 text-sm">
                        KES {entry.totalCommissionsEarned.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-emerald-50 rounded-xl p-2">
                      <p className="text-emerald-600 font-bold text-base">
                        {entry.activeReferrals}
                      </p>
                      <p className="text-gray-500">Active</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="font-bold text-base text-gray-700">
                        {entry.totalReferrals}
                      </p>
                      <p className="text-gray-500">Total</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="font-bold text-base text-gray-700">
                        {new Date(entry.memberSince).getFullYear()}
                      </p>
                      <p className="text-gray-500">Since</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
