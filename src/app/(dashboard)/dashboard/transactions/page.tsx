"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, Transaction } from "@/lib/api";
import {
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Image,
  Filter,
} from "lucide-react";

const txTypeLabels = {
  NFT_MINT: { label: "NFT Minted", icon: Image, color: "text-purple-600" },
  CONTRIBUTION: { label: "Contribution", icon: ArrowUpRight, color: "text-emerald-600" },
  CLAIM_DISBURSEMENT: { label: "Disbursement", icon: ArrowDownRight, color: "text-blue-600" },
  UPGRADE: { label: "Upgrade", icon: Coins, color: "text-yellow-600" },
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["blockchain-transactions", page],
    queryFn: () => api.getAllTransactions(page, 20),
  });

  const transactions = data?.data || [];
  const meta = data?.meta;

  const filteredTransactions = filter === "all"
    ? transactions
    : transactions.filter((tx) => tx.txType === filter);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-outfit">Blockchain Transactions</h1>
        <p className="text-gray-600 mt-1">
          Public audit log of all MenoDAO transactions on-chain
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Transparent & Auditable</h2>
            <p className="text-emerald-100 mt-1">
              Every contribution, claim, and NFT mint is recorded on the Polygon blockchain
              for complete transparency and accountability. Click any transaction to view on PolygonScan.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-gray-500" />
        {["all", "NFT_MINT", "CONTRIBUTION", "CLAIM_DISBURSEMENT", "UPGRADE"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === type
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {type === "all" ? "All" : txTypeLabels[type as keyof typeof txTypeLabels]?.label}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Transactions</h3>
            <p className="text-gray-600 mt-2">
              No blockchain transactions found
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Transaction Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      From → To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx: Transaction) => {
                    const typeInfo = txTypeLabels[tx.txType];
                    const TypeIcon = typeInfo?.icon || LinkIcon;

                    return (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <TypeIcon className={`w-5 h-5 ${typeInfo?.color}`} />
                            <span className="font-medium text-gray-900">
                              {typeInfo?.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`https://polygonscan.com/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 font-mono text-sm flex items-center gap-1"
                          >
                            {truncateAddress(tx.txHash)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 font-mono">
                            {truncateAddress(tx.fromAddress)} → {truncateAddress(tx.toAddress)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tx.amount ? (
                            <span className="font-medium text-gray-900">
                              KES {parseInt(tx.amount).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[tx.status]}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(tx.createdAt).toLocaleDateString("en-KE", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredTransactions.map((tx: Transaction) => {
                const typeInfo = txTypeLabels[tx.txType];
                const TypeIcon = typeInfo?.icon || LinkIcon;

                return (
                  <div key={tx.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`w-5 h-5 ${typeInfo?.color}`} />
                        <span className="font-medium text-gray-900">{typeInfo?.label}</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[tx.status]}`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Hash</span>
                        <a
                          href={`https://polygonscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 font-mono flex items-center gap-1"
                        >
                          {truncateAddress(tx.txHash)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {tx.amount && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-medium text-gray-900">
                            KES {parseInt(tx.amount).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Date</span>
                        <span className="text-gray-600">
                          {new Date(tx.createdAt).toLocaleDateString("en-KE")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {meta.page} of {meta.totalPages} ({meta.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
