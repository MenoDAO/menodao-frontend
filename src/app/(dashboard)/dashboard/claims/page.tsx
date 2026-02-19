"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, Claim } from "@/lib/api";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
} from "lucide-react";

const claimTypes = [
  { value: "DENTAL_CHECKUP", label: "Dental Checkup" },
  { value: "DENTAL_CLEANING", label: "Dental Cleaning" },
  { value: "DENTAL_FILLING", label: "Dental Filling" },
  { value: "DENTAL_EXTRACTION", label: "Dental Extraction" },
  { value: "ROOT_CANAL", label: "Root Canal" },
  { value: "OTHER", label: "Other Treatment" },
];

const claimSchema = z.object({
  claimType: z.string().min(1, "Please select a claim type"),
  description: z
    .string()
    .min(10, "Please provide more details about your claim"),
  amount: z.number().min(100, "Minimum claim amount is KES 100"),
});

type ClaimFormData = z.infer<typeof claimSchema>;

const statusColors = {
  PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", icon: Clock },
  APPROVED: { bg: "bg-blue-50", text: "text-blue-700", icon: CheckCircle },
  PROCESSING: { bg: "bg-purple-50", text: "text-purple-700", icon: Loader2 },
  DISBURSED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: CheckCircle,
  },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", icon: XCircle },
};

export default function ClaimsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ["claims"],
    queryFn: () => api.getMyClaims(),
  });

  const createClaimMutation = useMutation({
    mutationFn: (data: ClaimFormData) =>
      api.createClaim({
        claimType: data.claimType,
        description: data.description,
        amount: data.amount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      setIsModalOpen(false);
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      claimType: "",
      description: "",
      amount: 0,
    },
  });

  const onSubmit = (data: ClaimFormData) => {
    createClaimMutation.mutate(data);
  };

  const summary = claimsData?.summary;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">
            Claims
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Submit and track your benefit claims
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Claim
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              Claims Used
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {summary.claimsUsed}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              Claims Left
            </p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {summary.claimsRemaining}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              Amount Claimed
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
              KES {summary.amountClaimed.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              Limit Left
            </p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              KES {summary.amountRemaining.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Claims List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Claim History
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : claimsData?.claims.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No Claims Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Submit your first claim to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {claimsData?.claims.map((claim: Claim) => {
              const status = statusColors[claim.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={claim.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {claimTypes.find((t) => t.value === claim.claimType)
                            ?.label || claim.claimType}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text} flex items-center gap-1`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {claim.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {claim.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {new Date(claim.createdAt).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        KES {claim.amount.toLocaleString()}
                      </p>
                      {claim.txHash && (
                        <a
                          href={`https://polygonscan.com/tx/${claim.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 justify-end mt-1"
                        >
                          View on Chain
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Claim Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Submit New Claim
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {createClaimMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {(createClaimMutation.error as Error).message}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Claim Type
                </label>
                <select
                  {...register("claimType")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                >
                  <option value="" className="text-gray-500">
                    Select type...
                  </option>
                  {claimTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.claimType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.claimType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (KES)
                </label>
                <input
                  {...register("amount", { valueAsNumber: true })}
                  type="number"
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 placeholder-gray-500"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  placeholder="Describe the treatment you received..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none text-gray-900 placeholder-gray-500"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClaimMutation.isPending}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {createClaimMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Submit Claim"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
