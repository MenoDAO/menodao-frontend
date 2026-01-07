"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BrowserProvider, formatEther } from "ethers";

// Supported chains
export const SUPPORTED_CHAINS = {
  // Testnets
  80002: { name: "Polygon Amoy", explorer: "https://amoy.polygonscan.com", isTestnet: true },
  84532: { name: "Base Sepolia", explorer: "https://sepolia.basescan.org", isTestnet: true },
  44787: { name: "Celo Alfajores", explorer: "https://alfajores.celoscan.io", isTestnet: true },
  // Mainnets
  137: { name: "Polygon", explorer: "https://polygonscan.com", isTestnet: false },
  8453: { name: "Base", explorer: "https://basescan.org", isTestnet: false },
  42220: { name: "Celo", explorer: "https://celoscan.io", isTestnet: false },
} as const;

type ChainId = keyof typeof SUPPORTED_CHAINS;

interface WalletState {
  address: string | null;
  chainId: number | null;
  chainName: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

// Check if MetaMask or similar is available
const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new BrowserProvider(window.ethereum);
  }
  return null;
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      address: null,
      chainId: null,
      chainName: null,
      balance: null,
      isConnecting: false,
      error: null,

      connect: async () => {
        set({ isConnecting: true, error: null });

        try {
          if (typeof window === "undefined" || !window.ethereum) {
            throw new Error("Please install MetaMask or another Web3 wallet");
          }

          const provider = getProvider();
          if (!provider) {
            throw new Error("Could not initialize wallet provider");
          }

          // Request accounts
          const accounts = await provider.send("eth_requestAccounts", []);
          if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found");
          }

          const address = accounts[0];
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);
          const chainInfo = SUPPORTED_CHAINS[chainId as ChainId];
          
          // Get balance
          const balanceWei = await provider.getBalance(address);
          const balance = formatEther(balanceWei);

          set({
            address,
            chainId,
            chainName: chainInfo?.name || `Chain ${chainId}`,
            balance: parseFloat(balance).toFixed(4),
            isConnecting: false,
          });

          // Setup listeners
          window.ethereum.on("accountsChanged", (...args: unknown[]) => {
            const accounts = args[0] as string[];
            if (!accounts || accounts.length === 0) {
              get().disconnect();
            } else {
              set({ address: accounts[0] });
            }
          });

          window.ethereum.on("chainChanged", (...args: unknown[]) => {
            const chainIdHex = args[0] as string;
            const newChainId = parseInt(chainIdHex, 16);
            const chainInfo = SUPPORTED_CHAINS[newChainId as ChainId];
            set({
              chainId: newChainId,
              chainName: chainInfo?.name || `Chain ${newChainId}`,
            });
          });

        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to connect wallet";
          set({ error: message, isConnecting: false });
          throw err;
        }
      },

      disconnect: () => {
        set({
          address: null,
          chainId: null,
          chainName: null,
          balance: null,
          error: null,
        });
      },

      switchChain: async (targetChainId: number) => {
        try {
          if (!window.ethereum) {
            throw new Error("Wallet not connected");
          }

          const chainIdHex = `0x${targetChainId.toString(16)}`;

          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: chainIdHex }],
            });
          } catch (switchError: unknown) {
            // Chain not added, try to add it
            const chainInfo = SUPPORTED_CHAINS[targetChainId as ChainId];
            if (!chainInfo) {
              throw new Error("Unsupported chain");
            }

            // Add the chain
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: chainIdHex,
                chainName: chainInfo.name,
                rpcUrls: [getRpcUrl(targetChainId)],
                blockExplorerUrls: [chainInfo.explorer],
              }],
            });
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to switch chain";
          set({ error: message });
          throw err;
        }
      },
    }),
    {
      name: "menodao-wallet",
      partialize: (state) => ({
        // Only persist address for reconnection hint
        address: state.address,
      }),
    }
  )
);

function getRpcUrl(chainId: number): string {
  const rpcs: Record<number, string> = {
    80002: "https://rpc-amoy.polygon.technology",
    84532: "https://sepolia.base.org",
    44787: "https://alfajores-forno.celo-testnet.org",
    137: "https://polygon-rpc.com",
    8453: "https://mainnet.base.org",
    42220: "https://forno.celo.org",
  };
  return rpcs[chainId] || "";
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
