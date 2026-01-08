"use client";

import { useState, useEffect } from "react";
import { useWalletStore, SUPPORTED_CHAINS } from "@/lib/wallet-store";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { Wallet, ExternalLink, Award, Loader2, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { getApiUrl, api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

interface NFT {
  id: string;
  tokenId: string;
  tier: string;
  contractAddress: string;
  txHash: string;
  mintedAt: string;
  chain: string;
  explorerUrl?: string;
  metadata?: {
    claimed?: boolean;
    claimedTo?: string;
  };
}

interface CustodialWallet {
  address: string;
  type: string;
}

export function NFTSection() {
  const { address: connectedWallet } = useWalletStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [custodialWallet, setCustodialWallet] = useState<CustodialWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch NFTs and custodial wallet
  useEffect(() => {
    const token = api.getToken();
    if (!isAuthenticated || !token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const authToken = api.getToken();
        const headers = { Authorization: `Bearer ${authToken}` };

        const [nftsRes, walletRes] = await Promise.all([
          fetch(`${getApiUrl()}/blockchain/nfts`, { headers }),
          fetch(`${getApiUrl()}/blockchain/wallet`, { headers }),
        ]);

        if (nftsRes.ok) {
          const data = await nftsRes.json();
          setNfts(data);
        }

        if (walletRes.ok) {
          const data = await walletRes.json();
          setCustodialWallet(data);
        }
      } catch (err) {
        console.error("Failed to fetch blockchain data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Claim NFT to connected wallet
  const claimNFT = async (nftId: string) => {
    const authToken = api.getToken();
    if (!connectedWallet || !authToken) return;

    setClaiming(nftId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${getApiUrl()}/blockchain/nfts/${nftId}/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ externalWallet: connectedWallet }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`NFT claimed successfully! TX: ${data.txHash?.slice(0, 10)}...`);
        // Refresh NFTs
        const nftsRes = await fetch(`${getApiUrl()}/blockchain/nfts`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (nftsRes.ok) {
          setNfts(await nftsRes.json());
        }
      } else {
        setError(data.message || "Failed to claim NFT");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setClaiming(null);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "BRONZE":
        return "text-amber-600 bg-amber-100 dark:bg-amber-900/30";
      case "SILVER":
        return "text-gray-500 bg-gray-100 dark:bg-gray-700";
      case "GOLD":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  const getChainExplorer = (chain: string) => {
    const chainInfo = Object.values(SUPPORTED_CHAINS).find(
      (c) => c.name.toLowerCase().includes(chain.toLowerCase())
    );
    return chainInfo?.explorer || "https://polygonscan.com";
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading blockchain data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-600" />
          Wallet
        </h3>

        {/* Custodial Wallet */}
        {custodialWallet && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              MenoDAO Wallet (custodial)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm text-gray-900 dark:text-white break-all">
                {custodialWallet.address}
              </code>
              <button
                onClick={() => copyAddress(custodialWallet.address)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* External Wallet Connection */}
        <div className="border-t dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Connect your personal wallet to claim NFTs to your own address.
          </p>
          <ConnectWalletButton showBalance showChainSelector label="Connect Wallet" />
        </div>
      </div>

      {/* NFTs Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          Membership NFTs
        </h3>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {nfts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No NFTs yet. Subscribe to a package and make your first payment to receive your
              membership NFT!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {nfts.map((nft) => {
              const isClaimed = nft.metadata?.claimed;
              const canClaim = !!connectedWallet && !isClaimed;
              const explorer = getChainExplorer(nft.chain);

              return (
                <div
                  key={nft.id}
                  className="border dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {/* NFT Preview */}
                    <div
                      className={`w-14 h-14 rounded-lg flex items-center justify-center ${getTierColor(nft.tier)}`}
                    >
                      <span className="text-2xl">🦷</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(nft.tier)}`}
                        >
                          {nft.tier}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {nft.chain}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Minted {new Date(nft.mintedAt).toLocaleDateString()}
                      </p>
                      {isClaimed && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          ✓ Claimed to {nft.metadata?.claimedTo?.slice(0, 6)}...
                          {nft.metadata?.claimedTo?.slice(-4)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    {nft.txHash && (
                      <a
                        href={`${explorer}/tx/${nft.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {canClaim && (
                      <button
                        onClick={() => claimNFT(nft.id)}
                        disabled={claiming === nft.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        {claiming === nft.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Claiming...
                          </>
                        ) : (
                          "Claim to Wallet"
                        )}
                      </button>
                    )}

                    {!connectedWallet && !isClaimed && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Connect wallet to claim
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
