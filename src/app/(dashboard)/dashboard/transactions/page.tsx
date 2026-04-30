"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Transaction, NFT } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
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

const txTypeLabels = {
  NFT_MINT: { label: "NFT Minted", icon: Image, color: "text-purple-600" },
  CONTRIBUTION: {
    label: "Contribution",
    icon: ArrowUpRight,
    color: "text-emerald-600",
  },
  CLAIM_DISBURSEMENT: {
    label: "Disbursement",
    icon: ArrowDownRight,
    color: "text-blue-600",
  },
  UPGRADE: { label: "Upgrade", icon: Coins, color: "text-yellow-600" },
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

const tierColors = {
  BRONZE: "bg-amber-100 text-amber-800 border-amber-300",
  SILVER: "bg-gray-100 text-gray-700 border-gray-300",
  GOLD: "bg-yellow-100 text-yellow-800 border-yellow-400",
};

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>("all");
  const [claimModalNFT, setClaimModalNFT] = useState<NFT | null>(null);
  const [externalWallet, setExternalWallet] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["blockchain-transactions", page],
    queryFn: () => api.getAllTransactions(page, 20),
  });

  const { data: walletInfo } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.getWallet(),
  });

  const { data: nfts, isLoading: nftsLoading } = useQuery({
    queryKey: ["nfts"],
    queryFn: () => api.getNFTs(),
  });

  const claimMutation = useMutation({
    mutationFn: ({ nftId, wallet }: { nftId: string; wallet: string }) =>
      api.claimNFT(nftId, wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfts"] });
      queryClient.invalidateQueries({ queryKey: ["blockchain-transactions"] });
      setClaimModalNFT(null);
      setExternalWallet("");
      setConfirmStep(false);
    },
  });

  const transactions = data?.data || [];
  const meta = data?.meta;

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((tx) => tx.txType === filter);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isValidEthAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const isNFTClaimed = (nft: NFT) => {
    return (nft.metadata as Record<string, unknown>)?.claimed === true;
  };

  const openClaimModal = (nft: NFT) => {
    setClaimModalNFT(nft);
    setExternalWallet("");
    setConfirmStep(false);
    claimMutation.reset();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">
          {t("blockchain.pageTitle")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t("blockchain.pageSubtitle")}
        </p>
      </div>

      {/* My Wallet & Assets */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t("blockchain.custodialWallet")}</h2>
            <p className="text-purple-200 mt-1 text-sm">{t("blockchain.custodialDesc")}</p>
            {walletInfo && (
              <div className="mt-3 flex items-center gap-2">
                <code className="text-sm bg-white/10 px-3 py-1.5 rounded-lg font-mono">
                  {truncateAddress(walletInfo.address)}
                </code>
                <button onClick={() => copyAddress(walletInfo.address)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Copy address">
                  {copiedAddress ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My NFTs */}
      {nfts && nfts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-purple-600" />
            {t("blockchain.myNFTs")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => {
              const claimed = isNFTClaimed(nft);
              const tierStyle = tierColors[nft.tier] || tierColors.BRONZE;
              return (
                <div key={nft.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 p-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center mb-3">
                      <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tierStyle}`}>
                      {t("blockchain.tierMembership", { tier: nft.tier })}
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t("blockchain.chain")}</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{nft.chain || "Polygon"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t("blockchain.minted")}</span>
                      <span className="text-gray-600 dark:text-gray-400">{new Date(nft.mintedAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    {claimed ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                        <Check className="w-4 h-4" />
                        {t("blockchain.exportedToWallet")}
                      </div>
                    ) : (
                      <button onClick={() => openClaimModal(nft)} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                        <ExternalLink className="w-4 h-4" />
                        {t("blockchain.exportToWallet")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {nftsLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl"><LinkIcon className="w-6 h-6" /></div>
          <div>
            <h2 className="text-lg font-semibold">{t("blockchain.transparentTitle")}</h2>
            <p className="text-emerald-100 mt-1">{t("blockchain.transparentDesc")}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        {["all", "NFT_MINT", "CONTRIBUTION", "CLAIM_DISBURSEMENT", "UPGRADE"].map((type) => (
          <button key={type} onClick={() => setFilter(type)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === type ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
            {type === "all" ? t("blockchain.filterAll") : t(`blockchain.${type === "NFT_MINT" ? "nftMinted" : type === "CONTRIBUTION" ? "contribution" : type === "CLAIM_DISBURSEMENT" ? "disbursement" : "upgrade"}`)}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t("blockchain.noTxTitle")}</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t("blockchain.noTxDesc")}</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t("blockchain.colType")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t("blockchain.colHash")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t("blockchain.colFromTo")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t("blockchain.colAmount")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t("blockchain.colStatus")}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t("blockchain.colDate")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTransactions.map((tx: Transaction) => {
                    const typeInfo = txTypeLabels[tx.txType];
                    const TypeIcon = typeInfo?.icon || LinkIcon;
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><TypeIcon className={`w-5 h-5 ${typeInfo?.color}`} /><span className="font-medium text-gray-900 dark:text-white">{typeInfo?.label}</span></div></td>
                        <td className="px-6 py-4"><a href={`https://polygonscan.com/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-mono text-sm flex items-center gap-1">{truncateAddress(tx.txHash)}<ExternalLink className="w-3 h-3" /></a></td>
                        <td className="px-6 py-4"><div className="text-sm text-gray-600 dark:text-gray-400 font-mono">{truncateAddress(tx.fromAddress)} → {truncateAddress(tx.toAddress)}</div></td>
                        <td className="px-6 py-4">{tx.amount ? <span className="font-medium text-gray-900 dark:text-white">KES {parseInt(tx.amount).toLocaleString()}</span> : <span className="text-gray-400">-</span>}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>{tx.status}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(tx.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTransactions.map((tx: Transaction) => {
                const typeInfo = txTypeLabels[tx.txType];
                const TypeIcon = typeInfo?.icon || LinkIcon;
                return (
                  <div key={tx.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2"><TypeIcon className={`w-5 h-5 ${typeInfo?.color}`} /><span className="font-medium text-gray-900 dark:text-white">{typeInfo?.label}</span></div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>{tx.status}</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between"><span className="text-gray-500 dark:text-gray-400">Hash</span><a href={`https://polygonscan.com/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">{truncateAddress(tx.txHash)}<ExternalLink className="w-3 h-3" /></a></div>
                      {tx.amount && <div className="flex items-center justify-between"><span className="text-gray-500 dark:text-gray-400">{t("blockchain.colAmount")}</span><span className="font-medium text-gray-900 dark:text-white">KES {parseInt(tx.amount).toLocaleString()}</span></div>}
                      <div className="flex items-center justify-between"><span className="text-gray-500 dark:text-gray-400">{t("blockchain.colDate")}</span><span className="text-gray-600 dark:text-gray-400">{new Date(tx.createdAt).toLocaleDateString("en-KE")}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("common.page", { page: meta.page, total: meta.totalPages })} ({meta.total} total)</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">{t("common.previous")}</button>
              <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">{t("common.next")}</button>
            </div>
          </div>
        )}
      </div>

      {/* NFT Claim/Export Modal */}
      {claimModalNFT && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("blockchain.exportModalTitle")}</h2>
              <button onClick={() => setClaimModalNFT(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow flex items-center justify-center"><Shield className="w-6 h-6 text-purple-600" /></div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t("blockchain.nftMembership", { tier: claimModalNFT.tier })}</p>
                  <p className="text-sm text-gray-500 capitalize">{claimModalNFT.chain || "Polygon"} Network</p>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">{t("blockchain.importantTitle")}</p>
                    <ul className="mt-1 text-amber-700 dark:text-amber-400 space-y-1">
                      <li>• {t("blockchain.irreversible")}</li>
                      <li>• {t("blockchain.ensureNetwork", { network: claimModalNFT.chain || "Polygon" })}</li>
                      <li>• {t("blockchain.wrongAddress")}</li>
                      <li>• {t("blockchain.doubleCheck")}</li>
                    </ul>
                  </div>
                </div>
              </div>
              {claimMutation.isError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{(claimMutation.error as Error).message}</div>}
              {claimMutation.isSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-emerald-600" /></div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("blockchain.exportSuccess")}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">{t("blockchain.exportSuccessDesc")}</p>
                  <button onClick={() => setClaimModalNFT(null)} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">{t("common.done")}</button>
                </div>
              ) : !confirmStep ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("blockchain.walletAddressLabel")}</label>
                    <input type="text" value={externalWallet} onChange={(e) => setExternalWallet(e.target.value)} placeholder="0x..." className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder-gray-400" />
                    {externalWallet && !isValidEthAddress(externalWallet) && <p className="mt-1 text-sm text-red-600">Please enter a valid Ethereum address (0x followed by 40 hex characters)</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setClaimModalNFT(null)} className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t("common.cancel")}</button>
                    <button onClick={() => setConfirmStep(true)} disabled={!isValidEthAddress(externalWallet)} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t("blockchain.continue")}</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">NFT</span><span className="font-medium text-gray-900 dark:text-white">{t("blockchain.tierMembership", { tier: claimModalNFT.tier })}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t("blockchain.network")}</span><span className="font-medium text-gray-900 dark:text-white capitalize">{claimModalNFT.chain || "Polygon"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t("blockchain.to")}</span><span className="font-mono text-gray-900 dark:text-white">{truncateAddress(externalWallet)}</span></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmStep(false)} disabled={claimMutation.isPending} className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">{t("common.back")}</button>
                    <button onClick={() => claimMutation.mutate({ nftId: claimModalNFT.id, wallet: externalWallet })} disabled={claimMutation.isPending} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      {claimMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : t("blockchain.confirmExport")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

      {/* My Wallet & Assets */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Custodial Wallet</h2>
            <p className="text-purple-200 mt-1 text-sm">
              Your MenoDAO assets are held securely in a custodial wallet.
              Export them to your own wallet anytime.
            </p>
            {walletInfo && (
              <div className="mt-3 flex items-center gap-2">
                <code className="text-sm bg-white/10 px-3 py-1.5 rounded-lg font-mono">
                  {truncateAddress(walletInfo.address)}
                </code>
                <button
                  onClick={() => copyAddress(walletInfo.address)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <Check className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My NFTs */}
      {nfts && nfts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-purple-600" />
            My NFTs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => {
              const claimed = isNFTClaimed(nft);
              const tierStyle = tierColors[nft.tier] || tierColors.BRONZE;

              return (
                <div
                  key={nft.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* NFT Visual */}
                  <div className="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 p-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center mb-3">
                      <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${tierStyle}`}
                    >
                      {nft.tier} Membership
                    </span>
                  </div>

                  {/* NFT Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Chain
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {nft.chain || "Polygon"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Minted
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {new Date(nft.mintedAt).toLocaleDateString("en-KE", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {claimed ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                        <Check className="w-4 h-4" />
                        Exported to external wallet
                      </div>
                    ) : (
                      <button
                        onClick={() => openClaimModal(nft)}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Export to Wallet
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {nftsLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Transparent & Auditable</h2>
            <p className="text-emerald-100 mt-1">
              Every contribution, claim, and NFT mint is recorded on the
              blockchain for complete transparency and accountability.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        {[
          "all",
          "NFT_MINT",
          "CONTRIBUTION",
          "CLAIM_DISBURSEMENT",
          "UPGRADE",
        ].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === type
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {type === "all"
              ? "All"
              : txTypeLabels[type as keyof typeof txTypeLabels]?.label}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No Transactions
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              No blockchain transactions found
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Transaction Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      From → To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTransactions.map((tx: Transaction) => {
                    const typeInfo = txTypeLabels[tx.txType];
                    const TypeIcon = typeInfo?.icon || LinkIcon;

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <TypeIcon
                              className={`w-5 h-5 ${typeInfo?.color}`}
                            />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {typeInfo?.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`https://polygonscan.com/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-mono text-sm flex items-center gap-1"
                          >
                            {truncateAddress(tx.txHash)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {truncateAddress(tx.fromAddress)} →{" "}
                            {truncateAddress(tx.toAddress)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tx.amount ? (
                            <span className="font-medium text-gray-900 dark:text-white">
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
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
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
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTransactions.map((tx: Transaction) => {
                const typeInfo = txTypeLabels[tx.txType];
                const TypeIcon = typeInfo?.icon || LinkIcon;

                return (
                  <div key={tx.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`w-5 h-5 ${typeInfo?.color}`} />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {typeInfo?.label}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[tx.status]}`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Hash
                        </span>
                        <a
                          href={`https://polygonscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1"
                        >
                          {truncateAddress(tx.txHash)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {tx.amount && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            Amount
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            KES {parseInt(tx.amount).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Date
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
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
      </div>
    </div>
  );
}
