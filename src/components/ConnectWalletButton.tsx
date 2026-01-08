"use client";

import { useState } from "react";
import { useWalletStore, SUPPORTED_CHAINS } from "@/lib/wallet-store";
import { Wallet, ChevronDown, LogOut, Loader2, AlertCircle } from "lucide-react";

interface ConnectWalletButtonProps {
  showBalance?: boolean;
  showChainSelector?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function ConnectWalletButton({
  showBalance = false,
  showChainSelector = true,
  size = "md",
  label = "Connect Wallet",
}: ConnectWalletButtonProps) {
  const { address, chainId, chainName, balance, isConnecting, error, connect, disconnect } =
    useWalletStore();
  const [showChainMenu, setShowChainMenu] = useState(false);
  const [showError, setShowError] = useState(false);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const handleConnect = async () => {
    setShowError(false);
    try {
      await connect();
    } catch {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  // Not connected
  if (!address) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors ${sizeClasses[size]}`}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              {label}
            </>
          )}
        </button>

        {/* Error tooltip */}
        {showError && error && (
          <div className="absolute top-full mt-2 left-0 right-0 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 flex items-start gap-2 min-w-[250px] z-50">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Connected
  return (
    <div className="flex items-center gap-2">
      {/* Chain selector */}
      {showChainSelector && (
        <div className="relative">
          <button
            onClick={() => setShowChainMenu(!showChainMenu)}
            className={`flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors ${sizeClasses[size]}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {chainName || `Chain ${chainId}`}
            <ChevronDown className="w-3 h-3" />
          </button>

          {showChainMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowChainMenu(false)}
              />
              <div className="absolute top-full mt-1 right-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                {Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => (
                  <button
                    key={id}
                    onClick={() => {
                      useWalletStore.getState().switchChain(Number(id));
                      setShowChainMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                      Number(id) === chainId
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{chain.name}</span>
                    {chain.isTestnet && (
                      <span className="text-xs text-gray-400">testnet</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Wallet address & disconnect */}
      <div className="flex items-center">
        <button
          className={`flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-l-lg font-medium ${sizeClasses[size]}`}
        >
          <Wallet className="w-4 h-4" />
          <span>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          {showBalance && balance && (
            <span className="text-emerald-600 dark:text-emerald-500">
              {balance}
            </span>
          )}
        </button>
        <button
          onClick={disconnect}
          className={`bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-r-lg transition-colors ${sizeClasses[size]}`}
          title="Disconnect"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
