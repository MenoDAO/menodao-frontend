"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Loader2, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WithdrawalStatus =
  | "ALL"
  | "PENDING_ADMIN_APPROVAL"
  | "APPROVED"
  | "FAILED"
  | "COMPLETED"
  | "REJECTED";

interface WithdrawalRecord {
  id: string;
  championId: string;
  championName: string;
  championPhone: string;
  amount: number;
  status: Exclude<WithdrawalStatus, "ALL">;
  createdAt: string;
  rejectionReason?: string;
}

// ─── Admin API extension ──────────────────────────────────────────────────────

async function fetchWithdrawals(
  status: WithdrawalStatus,
): Promise<WithdrawalRecord[]> {
  const token = (() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("admin-auth-storage");
      if (!stored) return null;
      return JSON.parse(stored)?.state?.token ?? null;
    } catch {
      return null;
    }
  })();

  const params = status !== "ALL" ? `?status=${status}` : "";
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/admin/withdrawals${params}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function approveWithdrawal(id: string): Promise<void> {
  const token = (() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("admin-auth-storage");
      if (!stored) return null;
      return JSON.parse(stored)?.state?.token ?? null;
    } catch {
      return null;
    }
  })();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/admin/withdrawals/${id}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
}

async function rejectWithdrawal(id: string, reason: string): Promise<void> {
  const token = (() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("admin-auth-storage");
      if (!stored) return null;
      return JSON.parse(stored)?.state?.token ?? null;
    } catch {
      return null;
    }
  })();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/admin/withdrawals/${id}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reason }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WithdrawalRecord["status"] }) {
  const map: Record<WithdrawalRecord["status"], string> = {
    PENDING_ADMIN_APPROVAL: "bg-orange-500/20 text-orange-400",
    APPROVED: "bg-blue-500/20 text-blue-400",
    FAILED: "bg-red-500/20 text-red-400",
    COMPLETED: "bg-emerald-500/20 text-emerald-400",
    REJECTED: "bg-red-500/20 text-red-400",
    PENDING: "bg-yellow-500/20 text-yellow-400",
  };
  const label: Record<WithdrawalRecord["status"], string> = {
    PENDING_ADMIN_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    FAILED: "Failed",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
    PENDING: "Pending",
  };
  return (
    <span
      className={`text-xs px-2 py-1 rounded font-medium ${map[status] ?? "bg-gray-500/20 text-gray-400"}`}
    >
      {label[status] ?? status}
    </span>
  );
}

// ─── Row Actions ──────────────────────────────────────────────────────────────

function WithdrawalRow({
  record,
  onApprove,
  onReject,
}: {
  record: WithdrawalRecord;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reason, setReason] = useState("");

  const isPending = record.status === "PENDING_ADMIN_APPROVAL";

  return (
    <tr className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
      <td className="py-4 px-5">
        <p className="text-white font-medium">{record.championName}</p>
        <p className="text-gray-500 text-xs">{record.championPhone}</p>
      </td>
      <td className="py-4 px-5 text-white font-semibold">
        KES {record.amount.toLocaleString()}
      </td>
      <td className="py-4 px-5">
        <StatusBadge status={record.status} />
      </td>
      <td className="py-4 px-5 text-gray-400 text-sm">
        {new Date(record.createdAt).toLocaleDateString("en-KE")}
      </td>
      <td className="py-4 px-5">
        {isPending && !showRejectInput && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove(record.id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => setShowRejectInput(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
        {isPending && showRejectInput && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rejection reason..."
              className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500 w-40"
            />
            <button
              onClick={() => {
                if (reason.trim()) {
                  onReject(record.id, reason.trim());
                  setShowRejectInput(false);
                  setReason("");
                }
              }}
              disabled={!reason.trim()}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                setShowRejectInput(false);
                setReason("");
              }}
              className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        {record.rejectionReason && (
          <p className="text-xs text-red-400 mt-1">
            Reason: {record.rejectionReason}
          </p>
        )}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { label: string; value: WithdrawalStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending Approval", value: "PENDING_ADMIN_APPROVAL" },
  { label: "Approved", value: "APPROVED" },
  { label: "Failed", value: "FAILED" },
  { label: "Completed", value: "COMPLETED" },
];

export function WithdrawalManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<WithdrawalStatus>("ALL");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "withdrawals", activeTab],
    queryFn: () => fetchWithdrawals(activeTab),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      showToast("success", "Withdrawal approved successfully.");
    },
    onError: (err: Error) => showToast("error", err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectWithdrawal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      showToast("success", "Withdrawal rejected.");
    },
    onError: (err: Error) => showToast("error", err.message),
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-500" />
          Withdrawal Requests
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          Manage champion commission withdrawal requests
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-emerald-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">
            {(error as Error).message}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No withdrawal requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-5 text-gray-400 font-medium">
                    Champion
                  </th>
                  <th className="text-left py-4 px-5 text-gray-400 font-medium">
                    Amount
                  </th>
                  <th className="text-left py-4 px-5 text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="text-left py-4 px-5 text-gray-400 font-medium">
                    Date
                  </th>
                  <th className="text-left py-4 px-5 text-gray-400 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((record) => (
                  <WithdrawalRow
                    key={record.id}
                    record={record}
                    onApprove={(id) => approveMutation.mutate(id)}
                    onReject={(id, reason) =>
                      rejectMutation.mutate({ id, reason })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
