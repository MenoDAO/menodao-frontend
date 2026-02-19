"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { staffApi, StaffPortalClaim } from "@/lib/staff-api";
import { format } from "date-fns";

const COMMON_REJECTION_REASONS = [
  "Insufficient documentation provided",
  "Treatment not covered under current plan",
  "Duplicate claim submission",
  "Treatment was not pre-authorized",
  "Claim exceeds annual benefit limit",
  "Claim submitted outside coverage period",
];

type ModalState =
  | { type: "details"; claim: StaffPortalClaim }
  | { type: "reject"; claim: StaffPortalClaim }
  | { type: "success"; claim: StaffPortalClaim }
  | null;

export default function StaffClaimsPage() {
  const [claims, setClaims] = useState<StaffPortalClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState<ModalState>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const data = await staffApi.getStaffClaims(statusFilter || undefined);
      setClaims(data);
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [statusFilter, fetchClaims]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredClaims = claims.filter(
    (claim) =>
      claim.member.fullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      claim.member.phoneNumber.includes(searchQuery) ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleApprove = async (claim: StaffPortalClaim) => {
    setActionLoading(true);
    try {
      await staffApi.approveClaim(claim.id);
      setModalState({ type: "success", claim });
      await fetchClaims();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Failed to approve claim",
        type: "error",
      });
      setModalState(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (claim: StaffPortalClaim) => {
    if (!rejectionReason.trim()) {
      setToast({ message: "Please provide a rejection reason", type: "error" });
      return;
    }
    setActionLoading(true);
    try {
      await staffApi.rejectClaim(claim.id, rejectionReason.trim());
      setToast({ message: "Claim has been rejected", type: "success" });
      setModalState(null);
      setRejectionReason("");
      await fetchClaims();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Failed to reject claim",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 bg-green-50";
      case "DISBURSED":
        return "text-blue-600 bg-blue-50";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50";
      case "REJECTED":
        return "text-red-600 bg-red-50";
      case "PROCESSING":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "DISBURSED":
        return <CheckCircleIcon className="w-4 h-4 mr-1" />;
      case "PENDING":
        return <ClockIcon className="w-4 h-4 mr-1" />;
      case "REJECTED":
        return <XCircleIcon className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  const formatClaimType = (type: string) =>
    type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const pendingCount = claims.filter((c) => c.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <XCircleIcon className="w-5 h-5" />
          )}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Claims Management
          </h1>
          <p className="text-gray-500">
            Review and manage member health claims
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search member or claim ID..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="DISBURSED">Disbursed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Claim ID
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                      Loading claims...
                    </div>
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No claims found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 font-mono">
                        #{claim.id.slice(-6)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {claim.member.fullName || "Unnamed Member"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {claim.member.phoneNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {formatClaimType(claim.claimType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        KES {claim.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(claim.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}
                      >
                        {getStatusIcon(claim.status)}
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          setModalState({ type: "details", claim })
                        }
                        className="text-primary hover:text-primary-dark font-medium text-sm flex items-center"
                      >
                        Details
                        <ArrowRightIcon className="w-4 h-4 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Details Modal ─────────────────────────────────── */}
      {modalState?.type === "details" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Claim Details</h2>
              <button
                onClick={() => setModalState(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Claim ID</p>
                  <p className="font-mono text-gray-900">
                    {modalState.claim.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(modalState.claim.status)}`}
                  >
                    {getStatusIcon(modalState.claim.status)}
                    {modalState.claim.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Member Name</p>
                  <p className="font-medium text-gray-900">
                    {modalState.claim.member.fullName || "---"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="font-medium text-gray-900">
                    {modalState.claim.member.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Claim Type</p>
                  <p className="font-medium text-gray-900">
                    {formatClaimType(modalState.claim.claimType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="text-lg font-bold text-gray-900">
                    KES {modalState.claim.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <div className="bg-gray-50 p-4 rounded-2xl text-gray-700 min-h-[80px]">
                  {modalState.claim.description}
                </div>
              </div>

              {modalState.claim.rejectionReason && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Rejection Reason</p>
                  <div className="bg-red-50 p-4 rounded-2xl text-red-700 border border-red-100">
                    {modalState.claim.rejectionReason}
                  </div>
                </div>
              )}

              {modalState.claim.txHash && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Transaction Reference
                  </p>
                  <p className="text-xs font-mono text-primary break-all bg-primary/5 p-3 rounded-xl border border-primary/10">
                    {modalState.claim.txHash}
                  </p>
                </div>
              )}

              {modalState.claim.status === "PENDING" && (
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(modalState.claim)}
                    disabled={actionLoading}
                    className="flex-1 py-3 px-6 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircleIcon className="w-5 h-5" />
                    )}
                    Approve & Disburse
                  </button>
                  <button
                    onClick={() => {
                      setRejectionReason("");
                      setModalState({
                        type: "reject",
                        claim: modalState.claim,
                      });
                    }}
                    disabled={actionLoading}
                    className="flex-1 py-3 px-6 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircleIcon className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ──────────────────────────────────── */}
      {modalState?.type === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 bg-red-50/50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Reject Claim
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Claim #{modalState.claim.id.slice(-6)} · KES{" "}
                    {modalState.claim.amount.toLocaleString()} ·{" "}
                    {modalState.claim.member.fullName || "Unnamed"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setModalState({ type: "details", claim: modalState.claim })
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Select a reason:
                </p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_REJECTION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setRejectionReason(reason)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                        rejectionReason === reason
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Or write a custom reason:
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this claim is being rejected..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none resize-none h-24 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    setModalState({ type: "details", claim: modalState.claim })
                  }
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => handleReject(modalState.claim)}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 py-3 px-6 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircleIcon className="w-5 h-5" />
                  )}
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Animation Modal ───────────────────────── */}
      {modalState?.type === "success" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-12 flex flex-col items-center text-center">
              {/* Animated checkmark */}
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-300">
                  <svg
                    className="w-14 h-14 text-green-600 animate-in zoom-in duration-500 delay-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                      className="animate-draw-check"
                      style={{
                        strokeDasharray: 30,
                        strokeDashoffset: 30,
                        animation: "drawCheck 0.5s ease-out 0.3s forwards",
                      }}
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-full bg-green-200/50 animate-ping" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Claim Approved! ✅
              </h2>
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">
                  KES {modalState.claim.amount.toLocaleString()}
                </span>{" "}
                for {modalState.claim.member.fullName || "member"} has been
                approved.
              </p>
              <p className="text-sm text-green-600 font-medium bg-green-50 px-4 py-2 rounded-full">
                Disbursal will be processed shortly
              </p>

              <button
                onClick={() => setModalState(null)}
                className="mt-8 px-8 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global keyframes for checkmark animation */}
      <style jsx global>{`
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
