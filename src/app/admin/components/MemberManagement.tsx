"use client";

import { useState } from "react";
import {
  Search,
  X,
  User,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trophy,
} from "lucide-react";
import { adminApi, MemberDetailResponse } from "@/lib/admin-api";

// Extended type to include champion referral fields returned by the API
interface MemberDetailWithReferral extends MemberDetailResponse {
  referralCode?: string;
  referredBy?: string | null;
  firstPaymentCleared?: boolean;
  commissionsBalance?: number;
  commissionsWithdrawn?: number;
  activeReferralsCount?: number;
  isGoldMember?: boolean;
}

interface MemberManagementProps {
  memberId?: string;
}

export function MemberManagement({
  memberId: initialMemberId,
}: MemberManagementProps) {
  const [searchParams, setSearchParams] = useState({
    phoneNumber: "",
    email: "",
    memberId: initialMemberId || "",
  });
  const [searchResults, setSearchResults] = useState<
    MemberDetailWithReferral[]
  >([]);
  const [selectedMember, setSelectedMember] =
    useState<MemberDetailWithReferral | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasSearchParam = Object.values(searchParams).some(
      (val) => val.trim() !== "",
    );
    if (!hasSearchParam) {
      setSearchError("Please provide at least one search parameter");
      return;
    }

    try {
      setIsSearching(true);
      setSearchError("");

      const results = await adminApi.searchMembers(searchParams);
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError("No members found matching your search criteria");
      } else if (results.length === 1) {
        setSelectedMember(results[0]);
      }
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Failed to search members",
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewDetail = async (memberId: string) => {
    try {
      const detail = await adminApi.getMemberDetail(memberId);
      setSelectedMember(detail);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "Failed to load member details",
      );
    }
  };

  const handleClearSearch = () => {
    setSearchParams({
      phoneNumber: "",
      email: "",
      memberId: "",
    });
    setSearchResults([]);
    setSearchError("");
    setSelectedMember(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "text-emerald-400 bg-emerald-900/20 border-emerald-700/50";
      case "SUSPENDED":
        return "text-red-400 bg-red-900/20 border-red-700/50";
      case "INACTIVE":
        return "text-gray-400 bg-gray-900/20 border-gray-700/50";
      default:
        return "text-gray-400 bg-gray-900/20 border-gray-700/50";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case "BRONZE":
        return "text-orange-400 bg-orange-900/20 border-orange-700/50";
      case "SILVER":
        return "text-gray-300 bg-gray-700/20 border-gray-500/50";
      case "GOLD":
        return "text-yellow-400 bg-yellow-900/20 border-yellow-700/50";
      default:
        return "text-gray-400 bg-gray-900/20 border-gray-700/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <Search className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">Search Members</h2>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={searchParams.phoneNumber}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                placeholder="+254712345678"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={searchParams.email}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="user@example.com"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="memberId"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Member ID
              </label>
              <input
                type="text"
                id="memberId"
                value={searchParams.memberId}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    memberId: e.target.value,
                  }))
                }
                placeholder="Enter member ID"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {searchError && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
              <p className="text-sm text-red-400">{searchError}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 1 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-3">
            {searchResults.map((member) => (
              <div
                key={member.id}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-emerald-500/50 transition-colors cursor-pointer"
                onClick={() => handleViewDetail(member.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span
                        className={`text-sm px-2 py-1 rounded border ${getStatusColor(member.accountStatus)}`}
                      >
                        {member.accountStatus}
                      </span>
                      {member.subscription && (
                        <span
                          className={`text-sm px-2 py-1 rounded border ${getTierColor(member.subscription.tier)}`}
                        >
                          {member.subscription.tier}
                        </span>
                      )}
                    </div>
                    <p className="text-white font-medium mb-1">
                      {member.fullName}
                    </p>
                    <p className="text-sm text-gray-400">
                      {member.phoneNumber} • {member.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Detail */}
      {selectedMember && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Member Profile</h3>
            <button
              onClick={() => setSelectedMember(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Full Name</p>
                  <p className="text-white">{selectedMember.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Phone Number</p>
                  <p className="text-white">{selectedMember.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Email</p>
                  <p className="text-white">{selectedMember.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Location</p>
                  <p className="text-white">{selectedMember.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Registration Date
                  </p>
                  <p className="text-white">
                    {new Date(
                      selectedMember.registrationDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Account Status</p>
                  <span
                    className={`text-sm px-2 py-1 rounded border ${getStatusColor(selectedMember.accountStatus)}`}
                  >
                    {selectedMember.accountStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription Information */}
            {selectedMember.subscription && (
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Subscription Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Tier</p>
                    <span
                      className={`text-sm px-2 py-1 rounded border ${getTierColor(selectedMember.subscription.tier)}`}
                    >
                      {selectedMember.subscription.tier}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <span
                      className={`text-sm px-2 py-1 rounded border ${getStatusColor(selectedMember.subscription.status)}`}
                    >
                      {selectedMember.subscription.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Payment Frequency
                    </p>
                    <p className="text-white">
                      {selectedMember.subscription.paymentFrequency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Start Date</p>
                    <p className="text-white">
                      {new Date(
                        selectedMember.subscription.startDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Annual Cap Limit
                    </p>
                    <p className="text-white font-semibold">
                      KES{" "}
                      {selectedMember.subscription.annualCapLimit.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Annual Cap Used
                    </p>
                    <p className="text-white">
                      KES{" "}
                      {selectedMember.subscription.annualCapUsed.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Remaining Limit
                    </p>
                    <p className="text-white font-semibold text-emerald-400">
                      KES{" "}
                      {selectedMember.subscription.remainingLimit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Waiting Period Status */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Waiting Period Status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <p className="text-sm text-gray-400 mb-2">
                    Consultations & Extractions
                  </p>
                  {selectedMember.waitingPeriodStatus.consultationsExtractions
                    .available ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Available Now</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {
                          selectedMember.waitingPeriodStatus
                            .consultationsExtractions.daysRemaining
                        }{" "}
                        days remaining
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <p className="text-sm text-gray-400 mb-2">
                    Restorative Procedures
                  </p>
                  {selectedMember.waitingPeriodStatus.restorativeProcedures
                    .available ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Available Now</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {
                          selectedMember.waitingPeriodStatus
                            .restorativeProcedures.daysRemaining
                        }{" "}
                        days remaining
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Claim Summary */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Claim Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <p className="text-sm text-gray-400 mb-1">Total Claims</p>
                  <p className="text-2xl font-bold text-white">
                    {selectedMember.claimSummary.totalClaims}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <p className="text-sm text-gray-400 mb-1">
                    Total Amount Claimed
                  </p>
                  <p className="text-2xl font-bold text-white">
                    KES{" "}
                    {selectedMember.claimSummary.totalAmountClaimed.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <p className="text-sm text-gray-400 mb-1">Remaining Limit</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    KES{" "}
                    {selectedMember.claimSummary.remainingLimit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {selectedMember.paymentHistory &&
              selectedMember.paymentHistory.length > 0 && (
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Payment History
                  </h4>
                  <div className="space-y-2">
                    {selectedMember.paymentHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3 border border-gray-600"
                      >
                        <div>
                          <p className="text-white font-mono text-sm">
                            {payment.transactionId}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">
                            KES {payment.amount.toLocaleString()}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded border ${getStatusColor(payment.status)}`}
                          >
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Champion Referral Section */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Champion Referral
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Referral Code</p>
                  <p className="text-white font-mono">
                    {selectedMember.referralCode || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Referred By</p>
                  <p className="text-white font-mono">
                    {selectedMember.referredBy || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    First Payment Cleared
                  </p>
                  {selectedMember.firstPaymentCleared ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                      <CheckCircle className="w-4 h-4" /> Yes
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">No</span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Gold Member</p>
                  {selectedMember.isGoldMember ? (
                    <span className="inline-flex items-center gap-1 text-yellow-400 text-sm font-semibold">
                      <Trophy className="w-4 h-4" /> Gold Champion 🏆
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">No</span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Commissions Balance
                  </p>
                  <p className="text-white font-semibold">
                    KES{" "}
                    {(selectedMember.commissionsBalance ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Commissions Withdrawn
                  </p>
                  <p className="text-white">
                    KES{" "}
                    {(
                      selectedMember.commissionsWithdrawn ?? 0
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Active Referrals Count
                  </p>
                  <p className="text-white font-semibold">
                    {selectedMember.activeReferralsCount ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="border-t border-gray-700 pt-4">
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300">
                    Treatment details are not displayed to protect member
                    privacy. Only claim summaries and financial information are
                    shown.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
