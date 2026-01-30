"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { staffApi, StaffPortalClaim } from "@/lib/staff-api";
import { format } from "date-fns";

export default function StaffClaimsPage() {
  const [claims, setClaims] = useState<StaffPortalClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<StaffPortalClaim | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const filteredClaims = claims.filter(
    (claim) =>
      claim.member.fullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      claim.member.phoneNumber.includes(searchQuery) ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircleIcon className="w-4 h-4 mr-1" />;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Claims Management
          </h1>
          <p className="text-gray-500">
            Review and manage member health claims
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
                        {claim.claimType}
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
                        onClick={() => {
                          setSelectedClaim(claim);
                          setIsModalOpen(true);
                        }}
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

      {/* Details Modal */}
      {isModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 text-center">
                Claim Details
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Claim ID</p>
                  <p className="font-mono text-gray-900">{selectedClaim.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClaim.status)}`}
                  >
                    {getStatusIcon(selectedClaim.status)}
                    {selectedClaim.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Member Name</p>
                  <p className="font-medium text-gray-900">
                    {selectedClaim.member.fullName || "---"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="font-medium text-gray-900">
                    {selectedClaim.member.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Claim Type</p>
                  <p className="font-medium text-gray-900">
                    {selectedClaim.claimType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="text-lg font-bold text-gray-900">
                    KES {selectedClaim.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <div className="bg-gray-50 p-4 rounded-2xl text-gray-700 min-h-[100px]">
                  {selectedClaim.description}
                </div>
              </div>

              {selectedClaim.txHash && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Transaction Hash (Blockchain)
                  </p>
                  <p className="text-xs font-mono text-primary break-all bg-primary/5 p-3 rounded-xl border border-primary/10">
                    {selectedClaim.txHash}
                  </p>
                </div>
              )}

              {selectedClaim.status === "PENDING" && (
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button className="flex-1 py-3 px-6 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 transition-all">
                    Approve Claim
                  </button>
                  <button className="flex-1 py-3 px-6 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all">
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
