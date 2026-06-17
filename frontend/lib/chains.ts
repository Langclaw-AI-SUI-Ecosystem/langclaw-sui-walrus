import type { ProductChainId } from "@/lib/langclaw-api";

export type SuiNetwork = "testnet" | "mainnet";

export type ProductChain = {
  billingCurrency: {
    decimals: number;
    name: string;
    symbol: string;
    tokenAddress?: string;
  };
  id: ProductChainId;
  /**
   * Sui has no numeric EVM-style chain id. We keep a stable numeric tag so the
   * (ported) UI selectors that key on a number keep working.
   */
  chainId: number;
  explorerUrl: string;
  name: string;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
  };
  nativeSymbol: string;
  network: SuiNetwork;
  rpcUrl: string;
};

export const productChains: Record<ProductChainId, ProductChain> = {
  "sui-testnet": {
    id: "sui-testnet",
    chainId: 1,
    billingCurrency: {
      decimals: 9,
      name: "Sui",
      symbol: "SUI",
    },
    explorerUrl: "https://testnet.suivision.xyz",
    name: "Sui Testnet",
    nativeCurrency: {
      decimals: 9,
      name: "Sui",
      symbol: "SUI",
    },
    nativeSymbol: "SUI",
    network: "testnet",
    rpcUrl: "https://fullnode.testnet.sui.io:443",
  },
  "sui-mainnet": {
    id: "sui-mainnet",
    chainId: 0,
    billingCurrency: {
      decimals: 9,
      name: "Sui",
      symbol: "SUI",
    },
    explorerUrl: "https://suivision.xyz",
    name: "Sui Mainnet",
    nativeCurrency: {
      decimals: 9,
      name: "Sui",
      symbol: "SUI",
    },
    nativeSymbol: "SUI",
    network: "mainnet",
    rpcUrl: "https://fullnode.mainnet.sui.io:443",
  },
};

export const defaultProductChain: ProductChainId = "sui-mainnet";
export const productChainOptions = [productChains["sui-mainnet"]];

export function resolveProductChain(input?: string | null) {
  return input === "sui-testnet"
    ? productChains["sui-testnet"]
    : productChains["sui-mainnet"];
}

export function isProductChainId(value: unknown): value is ProductChainId {
  return value === "sui-testnet" || value === "sui-mainnet";
}
