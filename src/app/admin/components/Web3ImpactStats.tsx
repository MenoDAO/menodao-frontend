"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import {
  Loader2,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";

export function Web3ImpactStats() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "web3-stats"],
    queryFn: () => adminApi.getWeb3Stats(),
    refetchInterval: 60000,
  });

  const copyAddress = async () => {
    if (!data?.contract.address) return;
    await navigator.clipboard.writeText(data.contract.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  const c = data?.contract;
  const cases = data?.cases;

  return (
    <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-purple-500/30 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🔗</span>
        <h2 className="text-base sm:text-lg font-semibold text-white">
          Web3 Impact — Filecoin Calibration
        </h2>
        <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-medium">
          Live
        </span>
      </div>

      {/* Contract address */}
      <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
        <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">
          Active Contract
        </p>
        {c?.address ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-purple-300 break-all">
              {c.address}
            </span>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={copyAddress}
                title="Copy address"
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {c.explorerUrl && (
                <a
                  href={c.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on Filfox"
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-yellow-400">No contract deployed yet</p>
        )}
        <p className="text-xs text-gray-600 mt-1">{c?.network}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricTile
          label="Cases Analyzed"
          value={cases?.total ?? 0}
          color="text-white"
          bg="bg-gray-700"
        />
        <MetricTile
          label="Verified"
          value={cases?.verified ?? 0}
          color="text-green-400"
          bg="bg-green-500/10"
          icon={<CheckCircle className="w-4 h-4 text-green-400" />}
        />
        <MetricTile
          label="Rejected"
          value={cases?.rejected ?? 0}
          color="text-red-400"
          bg="bg-red-500/10"
          icon={<XCircle className="w-4 h-4 text-red-400" />}
        />
        <MetricTile
          label="Success Rate"
          value={`${cases?.successRate ?? 0}%`}
          color="text-purple-300"
          bg="bg-purple-500/10"
        />
      </div>

      {/* Pending indicator */}
      {(cases?.pending ?? 0) > 0 && (
        <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{cases?.pending} case(s) currently processing on-chain</span>
        </div>
      )}

      {/* Recent verified cases */}
      {data?.recentVerified && data.recentVerified.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
            Recent Verified Cases
          </p>
          <div className="space-y-2">
            {data.recentVerified.map((v) => (
              <div
                key={v.visitId}
                className="flex items-center justify-between text-xs bg-gray-900 rounded-lg px-3 py-2 gap-2"
              >
                <div className="min-w-0">
                  <p className="text-gray-300 truncate">{v.clinic}</p>
                  <p className="text-gray-600">
                    {new Date(v.verifiedAt).toLocaleDateString()}
                  </p>
                </div>
                {v.explorerUrl && (
                  <a
                    href={v.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline shrink-0 flex items-center gap-1"
                  >
                    Tx <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impact narrative for investors */}
      <p className="text-xs text-gray-500 border-t border-gray-700 pt-3">
        Each verified case = AI-confirmed dental improvement + on-chain payout
        to clinic + Hypercert impact proof pinned to IPFS.
      </p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  color,
  bg,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  bg: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`${bg} rounded-lg p-3 text-center`}>
      {icon && <div className="flex justify-center mb-1">{icon}</div>}
      <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
