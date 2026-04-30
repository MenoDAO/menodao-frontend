"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { api, Transaction, NFT, WalletInfo } from "@/lib/api";
import {
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Image,
  Filter,
  Wallet,
  Shield,
  AlertTriangle,
  Copy,
  Check,
  X,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TX_FILTERS = [
  "all",
  "NFT_MINT",
  "CONTRIBUTION",
  "CLAIM_DISBURSEMENT",
  "UPGRADE",
] as const;

type TxFilter = (typeof TX_FILTERS)[number];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

const tierColors: Record<string, string> = {
  BRONZE: "bg-amber-100 text-amber-800 border-amber-300",
  SILVER: "bg-gray-100 text-gray-700 border-gray-300",
  GOLD: "bg-yellow-100 text-yellow-800 border-yellow-400",
};

const ITEMS_PER_PAGE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateHash(hash: string, chars = 8): string {
  if (!hash) return "";
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

function TxTypeIcon({ txType }: { txType: Transaction["txType"] }) {
  switch (txType) {
    case "NFT_MINT":
      return <Image className="w-4 h-4 text-purple-500" />;
    case "CONTRIBUTION":
      return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
    case "CLAIM_DISBURSEMENT":
      return <ArrowDownRight className="w-4 h-4 text-blue-500" />;
    case "UPGRADE":
      return <Coins className="w-4 h-4 text-amber-500" />;
    default:
      return <LinkIcon className="w-4 h-4 text-gray-400" />;
  }
}

// ─── Export NFT Modal ─────────────────────────────────────────────────────────

interface ExportModalProps {
  nft: NFT;
  onClose: () => void;
}

function ExportModal({ nft, onClose }: ExportModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"warning" | "address" | "success">(
    "warning",
  );
  const [walletAddress, setWalletAddress] = useState("");
  const [copied, setCopied] = useState(false);

  const claimMutation = useMutation({
    mutationFn: () => api.claimNFT(nft.id, walletAddress),
    onSuccess: () => {
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["nfts"] });
    },
  });

  const handleCopyTxHash = async () => {
    if (claimMutation.data?.txHash) {
      await navigator.clipboard.writeText(claimMutation.data.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("blockchain.exportModalTitle")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* NFT info */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border mb-6 ${tierColors[nft.tier] ?? "bg-gray-50 border-gray-200"}`}
          >
            <Image className="w-8 h-8 opacity-70" />
            <div>
              <p className="font-semibold text-sm">
                {t("blockchain.nftMembership", { tier: nft.tier })}
              </p>
              <p className="text-xs opacity-70">
                {t("blockchain.chain")}: {nft.chain ?? "Filecoin"}
              </p>
            </div>
          </div>

          {/* Step: warning */}
          {step === "warning" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm mb-2">
                    {t("blockchain.importantTitle")}
                  </p>
                  <ul className="space-y-1 text-sm text-amber-700 list-disc list-inside">
                    <li>{t("blockchain.irreversible")}</li>
                    <li>
                      {t("blockchain.ensureNetwork", {
                        network: nft.chain ?? "Filecoin",
                      })}
                    </li>
                    <li>{t("blockchain.wrongAddress")}</li>
                    <li>{t("blockchain.doubleCheck")}</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => setStep("address")}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  {t("blockchain.continue")}
                </button>
              </div>
            </div>
          )}

          {/* Step: address */}
          {step === "address" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("blockchain.walletAddressLabel")}
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                />
              </div>
              {claimMutation.isError && (
                <p className="text-sm text-red-600">
                  {claimMutation.error instanceof Error
                    ? claimMutation.error.message
                    : "Export failed"}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("warning")}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  {t("common.back")}
                </button>
                <button
                  onClick={() => claimMutation.mutate()}
                  disabled={!walletAddress.trim() || claimMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  {claimMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {t("blockchain.confirmExport")}
                </button>
              </div>
            </div>
          )}

          {/* Step: success */}
          {step === "success" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {t("blockchain.exportSuccess")}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {t("blockchain.exportSuccessDesc")}
                </p>
              </div>
              {claimMutation.data?.txHash && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 text-left">
                  <span className="text-xs font-mono text-gray-600 flex-1 truncate">
                    {claimMutation.data.txHash}
                  </span>
                  <button
                    onClick={handleCopyTxHash}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                {t("common.done")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NFT Card ─────────────────────────────────────────────────────────────────

interface NFTCardProps {
  nft: NFT;
  onExport: (nft: NFT) => void;
}

function NFTCard({ nft, onExport }: NFTCardProps) {
  const { t } = useTranslation();
  const isClaimed = !nft.isCustodial;

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-3 ${tierColors[nft.tier] ?? "bg-gray-50 border-gray-200"}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Image className="w-6 h-6 opacity-70" />
          <span className="font-semibold text-sm">
            {t("blockchain.tierMembership", { tier: nft.tier })}
          </span>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 border border-current opacity-70">
          {nft.tier}
        </span>
      </div>

      <div className="space-y-1 text-xs opacity-80">
        <div className="flex items-center gap-1">
          <span className="font-medium">{t("blockchain.minted")}:</span>
          <span>{new Date(nft.mintedAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">{t("blockchain.chain")}:</span>
          <span>{nft.chain ?? "Filecoin"}</span>
        </div>
        {nft.tokenId && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Token ID:</span>
            <span className="font-mono">{nft.tokenId}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-auto pt-1">
        {nft.explorerUrl && (
          <a
            href={nft.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs hover:underline opacity-70 hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="w-3 h-3" />
            Explorer
          </a>
        )}
        {isClaimed ? (
          <span className="ml-auto text-xs flex items-center gap-1 opacity-70">
            <Check className="w-3 h-3" />
            {t("blockchain.exportedToWallet")}
          </span>
        ) : (
          <button
            onClick={() => onExport(nft)}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/70 hover:bg-white border border-current rounded-lg font-medium transition-colors"
          >
            <Wallet className="w-3 h-3" />
            {t("blockchain.exportToWallet")}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function txTypeLabel(
  txType: Transaction["txType"],
  t: (key: string) => string,
): string {
  switch (txType) {
    case "NFT_MINT":
      return t("blockchain.nftMinted");
    case "CONTRIBUTION":
      return t("blockchain.contribution");
    case "CLAIM_DISBURSEMENT":
      return t("blockchain.disbursement");
    case "UPGRADE":
      return t("blockchain.upgrade");
    default:
      return txType;
  }
}

interface TxRowProps {
  tx: Transaction;
}

function TxRow({ tx }: TxRowProps) {
  const { t } = useTranslation();

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <TxTypeIcon txType={tx.txType} />
          <span className="text-sm text-gray-700">
            {txTypeLabel(tx.txType, t)}
          </span>
        </div>
      </td>

      {/* Hash */}
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-gray-500">
          {truncateHash(tx.txHash)}
        </span>
      </td>

      {/* From → To */}
      <td className="px-4 py-3">
        <div className="text-xs text-gray-500 space-y-0.5">
          <div className="font-mono">{truncateHash(tx.fromAddress, 6)}</div>
          <div className="text-gray-400">↓</div>
          <div className="font-mono">{truncateHash(tx.toAddress, 6)}</div>
        </div>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-sm text-gray-700">
        {tx.amount ? tx.amount : tx.tokenId ? `#${tx.tokenId}` : "—"}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tx.status] ?? "bg-gray-100 text-gray-600"}`}
        >
          {tx.status}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {new Date(tx.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TxFilter>("all");
  const [page, setPage] = useState(1);
  const [exportNft, setExportNft] = useState<NFT | null>(null);

  // Data fetching
  const txQuery = useQuery({
    queryKey: ["blockchain-transactions", page],
    queryFn: () => api.getAllTransactions(page, ITEMS_PER_PAGE),
  });

  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.getWallet(),
  });

  const nftsQuery = useQuery({
    queryKey: ["nfts"],
    queryFn: () => api.getNFTs(),
  });

  // Filtered transactions (client-side filter on current page)
  const allTxs = txQuery.data?.data ?? [];
  const filteredTxs =
    filter === "all" ? allTxs : allTxs.filter((tx) => tx.txType === filter);

  const totalPages = txQuery.data?.meta.totalPages ?? 1;
  const wallet: WalletInfo | undefined = walletQuery.data;
  const nfts: NFT[] = nftsQuery.data ?? [];

  const isLoading =
    txQuery.isLoading || walletQuery.isLoading || nftsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t("blockchain.pageTitle")}
        </h1>
        <p className="text-gray-600 mt-1">{t("blockchain.pageSubtitle")}</p>
      </div>

      {/* Top cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Custodial wallet card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">
              {t("blockchain.custodialWallet")}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {t("blockchain.custodialDesc")}
            </p>
            {wallet?.address && (
              <p className="font-mono text-xs text-gray-400 mt-2 truncate">
                {wallet.address}
              </p>
            )}
          </div>
        </div>

        {/* Transparent & auditable card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <LinkIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {t("blockchain.transparentTitle")}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {t("blockchain.transparentDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* NFTs section */}
      {nfts.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-purple-500" />
            {t("blockchain.myNFTs")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <NFTCard key={nft.id} nft={nft} onExport={setExportNft} />
            ))}
          </div>
        </section>
      )}

      {/* Transactions section */}
      <section>
        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {TX_FILTERS.map((f) => {
            const label =
              f === "all"
                ? t("blockchain.filterAll")
                : txTypeLabel(f as Transaction["txType"], t);
            return (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Table */}
        {txQuery.isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {txQuery.error instanceof Error
              ? txQuery.error.message
              : "Failed to load transactions"}
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {t("blockchain.noTxTitle")}
            </h3>
            <p className="text-gray-500 text-sm">{t("blockchain.noTxDesc")}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("blockchain.colType")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("blockchain.colHash")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("blockchain.colFromTo")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("blockchain.colAmount")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("blockchain.colStatus")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t("blockchain.colDate")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map((tx) => (
                    <TxRow key={tx.id} tx={tx} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {t("common.previous")}
            </button>
            <span className="text-sm text-gray-600">
              {t("common.page", { page, total: totalPages })}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </section>

      {/* Export modal */}
      {exportNft && (
        <ExportModal nft={exportNft} onClose={() => setExportNft(null)} />
      )}
    </div>
  );
}
