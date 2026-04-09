"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ChampionStats, ReferralEntry, WithdrawalRecord } from "@/lib/api";
import {
  Copy,
  Share2,
  Trophy,
  Users,
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowDownToLine,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${highlight ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`p-2 rounded-xl ${highlight ? "bg-emerald-100" : "bg-gray-100"}`}
        >
          <Icon
            className={`w-5 h-5 ${highlight ? "text-emerald-600" : "text-gray-600"}`}
          />
        </div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p
        className={`text-2xl font-bold ${highlight ? "text-emerald-700" : "text-gray-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-48" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-32 bg-gray-200 rounded-2xl" />
      <div className="h-48 bg-gray-200 rounded-2xl" />
    </div>
  );
}

// ─── Withdrawal Status Badge ──────────────────────────────────────────────────

function WithdrawalBadge({ status }: { status: WithdrawalRecord["status"] }) {
  const map: Record<WithdrawalRecord["status"], string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PENDING_ADMIN_APPROVAL: "bg-orange-100 text-orange-700",
    APPROVED: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    FAILED: "bg-red-100 text-red-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
  };
  const label: Record<WithdrawalRecord["status"], string> = {
    PENDING: "Pending",
    PENDING_ADMIN_APPROVAL: "Awaiting Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    FAILED: "Failed",
    COMPLETED: "Completed",
  };
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChampionPage() {
  const queryClient = useQueryClient();
  const [referralsPage, setReferralsPage] = useState(1);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMsg, setWithdrawMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["champion", "stats"],
    queryFn: () => api.getChampionStats(),
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["champion", "referrals", referralsPage],
    queryFn: () => api.getChampionReferrals(referralsPage, 10),
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["champion", "withdrawals"],
    queryFn: () => api.getWithdrawalHistory(),
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => api.requestWithdrawal(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["champion"] });
      setWithdrawMsg({
        type: "success",
        text: "Withdrawal request submitted successfully!",
      });
      setShowWithdrawForm(false);
      setWithdrawAmount("");
    },
    onError: (err: Error) => {
      setWithdrawMsg({
        type: "error",
        text: err.message || "Failed to submit withdrawal.",
      });
    },
  });

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async (inviteLink: string) => {
    const message = `Here's your personal invite link! Forward this message to your friends and Chama members. You earn 10% commission for every person who makes their first premium payment! ${inviteLink}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        await navigator.clipboard.writeText(inviteLink);
        setCopied("link");
        setTimeout(() => setCopied(null), 2000);
      }
    } else {
      await navigator.clipboard.writeText(inviteLink);
      setCopied("link");
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount < 200) return;
    setWithdrawMsg(null);
    withdrawMutation.mutate(amount);
  };

  if (statsLoading) return <Skeleton />;

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        Failed to load champion data.
      </div>
    );
  }

  const balance = stats.commissionsBalance;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">
            Champion Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your referrals and commissions
          </p>
        </div>
        {stats.isGoldMember && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-300 rounded-2xl px-4 py-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-yellow-700">
              Gold Champion 🏆
            </span>
          </div>
        )}
      </div>

      {/* Gold Member Banner */}
      {stats.isGoldMember && (
        <div className="rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-600 p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <p className="font-bold text-lg">Gold Champion Status Active</p>
              <p className="text-yellow-100 text-sm">
                Your monthly premium is waived. You have 25+ active paying
                referrals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Referrals"
          value={stats.totalReferrals}
          icon={Users}
        />
        <StatCard
          label="Active Referrals"
          value={stats.activeReferrals}
          icon={TrendingUp}
          highlight
        />
        <StatCard
          label="Commissions Earned"
          value={`KES ${stats.commissionsEarned.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          label="Commissions Balance"
          value={`KES ${stats.commissionsBalance.toLocaleString()}`}
          icon={Wallet}
          highlight
        />
        <StatCard
          label="Commissions Withdrawn"
          value={`KES ${stats.commissionsWithdrawn.toLocaleString()}`}
          icon={ArrowDownToLine}
        />
      </div>

      {/* Referral Code & Invite Link */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-emerald-800">
          Your Referral Info
        </h2>

        {/* Referral Code */}
        <div>
          <p className="text-sm text-emerald-700 mb-1 font-medium">
            Referral Code
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold text-emerald-900 bg-white border border-emerald-200 rounded-xl px-4 py-2 tracking-widest">
              {stats.referralCode}
            </span>
            <button
              onClick={() => copyToClipboard(stats.referralCode, "code")}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied === "code" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Invite Link */}
        <div>
          <p className="text-sm text-emerald-700 mb-1 font-medium">
            Invite Link
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-emerald-800 bg-white border border-emerald-200 rounded-xl px-3 py-2 break-all flex-1 min-w-0">
              {stats.inviteLink}
            </span>
            <button
              onClick={() => copyToClipboard(stats.inviteLink, "link")}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied === "link" ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => handleShare(stats.inviteLink)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawal Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Withdraw Commissions
        </h2>

        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-emerald-600" />
          <div>
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              KES {balance.toLocaleString()}
            </p>
          </div>
        </div>

        {withdrawMsg && (
          <div
            className={`rounded-xl p-3 text-sm ${withdrawMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}
          >
            {withdrawMsg.text}
          </div>
        )}

        {balance < 200 ? (
          <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-200">
            Minimum withdrawal is KES 200. Current balance: KES{" "}
            {balance.toLocaleString()}.
          </p>
        ) : !showWithdrawForm ? (
          <button
            onClick={() => {
              setShowWithdrawForm(true);
              setWithdrawMsg(null);
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            Withdraw
          </button>
        ) : (
          <form
            onSubmit={handleWithdrawSubmit}
            className="flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Amount (KES)
              </label>
              <input
                type="number"
                min={200}
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                required
                className="px-3 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40"
              />
            </div>
            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              {withdrawMutation.isPending ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowWithdrawForm(false);
                setWithdrawAmount("");
              }}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Withdrawal History */}
        {!withdrawalsLoading && withdrawals && withdrawals.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Withdrawal History
            </h3>
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      KES {w.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(w.createdAt).toLocaleDateString("en-KE")}
                    </p>
                  </div>
                  <WithdrawalBadge status={w.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Referrals List */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">My Referrals</h2>

        {referralsLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : !referrals || referrals.data.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No referrals yet. Share your invite link to get started!</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      Name
                    </th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      Registered
                    </th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      First Payment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.data.map((r: ReferralEntry) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-3 text-gray-900 font-medium">
                        {r.firstName}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {new Date(r.registrationDate).toLocaleDateString(
                          "en-KE",
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {r.firstPaymentCleared ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="w-4 h-4" /> Cleared ✅
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-4 h-4" /> Pending ⏳
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {referrals.data.map((r: ReferralEntry) => (
                <div
                  key={r.id}
                  className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{r.firstName}</p>
                    <span>{r.firstPaymentCleared ? "✅" : "⏳"}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Joined{" "}
                    {new Date(r.registrationDate).toLocaleDateString("en-KE")}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {referrals.meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setReferralsPage((p) => Math.max(1, p - 1))}
                  disabled={referralsPage === 1}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {referralsPage} of {referrals.meta.totalPages}
                </span>
                <button
                  onClick={() =>
                    setReferralsPage((p) =>
                      Math.min(referrals.meta.totalPages, p + 1),
                    )
                  }
                  disabled={referralsPage === referrals.meta.totalPages}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm disabled:opacity-50"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
