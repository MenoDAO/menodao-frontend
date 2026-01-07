"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygon, polygonAmoy, base, baseSepolia, celo, celoAlfajores } from "wagmi/chains";

// Determine if we're in dev/testnet mode
const isTestnet = process.env.NEXT_PUBLIC_CHAIN_ENV !== "production";

// Define chains based on environment
const chains = isTestnet
  ? [polygonAmoy, baseSepolia, celoAlfajores] as const
  : [polygon, base, celo] as const;

export const wagmiConfig = getDefaultConfig({
  appName: "MenoDAO",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains,
  ssr: true,
});

export { chains };
