"use client";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import React from "react";

import { defaultProductChain, productChains } from "@/lib/chains";

const { networkConfig } = createNetworkConfig({
  mainnet: { url: getJsonRpcFullnodeUrl("mainnet"), network: "mainnet" },
});

const queryClient = new QueryClient();

const defaultNetwork = productChains[defaultProductChain].network as "mainnet";

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
        <WalletProvider autoConnect storageKey="langclaw.sui.wallet">
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
