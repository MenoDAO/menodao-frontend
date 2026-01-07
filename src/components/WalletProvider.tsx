"use client";

import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi-config";
import { useThemeStore } from "@/lib/theme-store";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { getEffectiveTheme } = useThemeStore();
  const effectiveTheme = getEffectiveTheme();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={effectiveTheme === "dark" ? darkTheme({
            accentColor: "#10b981",
            accentColorForeground: "white",
            borderRadius: "medium",
          }) : lightTheme({
            accentColor: "#10b981",
            accentColorForeground: "white",
            borderRadius: "medium",
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
