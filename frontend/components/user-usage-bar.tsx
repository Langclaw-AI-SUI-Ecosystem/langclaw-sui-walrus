"use client";

import { useMemo } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { ShieldCheck, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWalletSession } from "@/hooks/use-wallet-session";
import { resolveProductChain } from "@/lib/chains";

// Earlier builds showed prepaid usage credits sourced from an on-chain vault.
// The Sui v1 build runs the private-memory agent without prepaid credits, so
// this is a lightweight wallet + SUI balance summary instead.
export function UserUsageBar() {
  const { address, isConnected, openWalletModal } = useWalletSession();
  const chain = resolveProductChain();
  const { data: balance } = useSuiClientQuery(
    "getBalance",
    { owner: address ?? "" },
    { enabled: Boolean(address) },
  );

  const balanceLabel = useMemo(() => {
    if (!balance) return null;

    const value = Number(balance.totalBalance) / 1e9;

    return `${Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "0"} ${chain.nativeSymbol}`;
  }, [balance, chain.nativeSymbol]);

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <ShieldCheck className="size-4 text-primary" />
        <span>Private memory agent</span>
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
          {chain.name}
        </Badge>
      </div>
      {isConnected ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wallet className="size-4" />
          <span className="font-medium text-foreground">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet"}
          </span>
          <span>{balanceLabel ?? "Balance loading"}</span>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={openWalletModal}>
          <Wallet className="size-4" />
          Connect wallet
        </Button>
      )}
    </div>
  );
}
