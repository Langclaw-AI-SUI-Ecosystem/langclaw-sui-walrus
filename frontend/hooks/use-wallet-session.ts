"use client";

import { useCallback } from "react";
import {
  useCurrentAccount,
  useCurrentWallet,
  useSignPersonalMessage,
} from "@mysten/dapp-kit";

import {
  createWalletSession,
  requestWalletChallenge,
  type ProductChainId,
  type WalletAuth,
  type WalletAuthPurpose,
} from "@/lib/langclaw-api";
import { productChainOptions, resolveProductChain } from "@/lib/chains";

export const WALLET_AUTH_UPDATED_EVENT = "langclaw-wallet-auth-updated";
export const WALLET_CONNECT_MODAL_EVENT = "langclaw-open-wallet-modal";

const WALLET_AUTH_STORAGE_PREFIX = "langclaw.walletSession.v2";
const SESSION_REFRESH_MARGIN_MS = 60 * 1000;
const inFlightSessionAuth = new Map<string, Promise<WalletAuth>>();

type WalletAuthOptions = {
  chain?: ProductChainId;
  force?: boolean;
  purpose?: WalletAuthPurpose;
};

export function useWalletSession() {
  const account = useCurrentAccount();
  const { connectionStatus } = useCurrentWallet();
  const { isPending: isSigning, mutateAsync: signPersonalMessage } =
    useSignPersonalMessage();

  const address = account?.address;
  const isConnected = Boolean(account);
  const isConnecting = connectionStatus === "connecting";

  const openWalletModal = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new Event(WALLET_CONNECT_MODAL_EVENT));
  }, []);

  const getWalletAuth = useCallback(
    async (options: WalletAuthOptions = {}) => {
      if (!isConnected || !address) {
        throw new Error("Connect your wallet first.");
      }

      const purpose = options.purpose ?? "session";
      const chain = resolveProductChain(options.chain);

      if (purpose === "session" && !options.force) {
        const cached = readCachedWalletAuth(address, chain.id);

        if (cached) {
          return cached;
        }
      }

      const createAuth = async () => {
        // Keep the backend's challenge/session flow: request a challenge,
        // sign it with the Sui wallet's personal-message signer, then exchange
        // the signed challenge for a session token.
        const challenge = await requestWalletChallenge({
          address,
          chainId: chain.chainId,
          purpose,
        });
        const { signature } = await signPersonalMessage({
          message: new TextEncoder().encode(challenge.message),
        });
        const walletAuth: WalletAuth = {
          address: challenge.address,
          message: challenge.message,
          signature,
        };

        if (purpose !== "session") {
          return walletAuth;
        }

        const session = await createWalletSession(walletAuth);

        writeCachedWalletAuth(session, chain.id);
        dispatchWalletAuthUpdated();

        return session;
      };

      if (purpose !== "session") {
        return createAuth();
      }

      const requestKey = `${address.toLowerCase()}:${chain.id}:${options.force ? "force" : "session"}`;
      const existingRequest = inFlightSessionAuth.get(requestKey);

      if (existingRequest) {
        return existingRequest;
      }

      const request = createAuth();
      inFlightSessionAuth.set(requestKey, request);

      try {
        return await request;
      } finally {
        inFlightSessionAuth.delete(requestKey);
      }
    },
    [address, isConnected, signPersonalMessage],
  );

  const clearWalletAuth = useCallback(() => {
    if (address && typeof window !== "undefined") {
      for (const chain of productChainOptions) {
        window.localStorage.removeItem(
          getWalletAuthStorageKey(address, chain.id),
        );
      }
    }

    dispatchWalletAuthUpdated();
  }, [address]);

  return {
    address,
    clearWalletAuth,
    getWalletAuth,
    hasCachedWalletAuth: Boolean(
      address &&
        productChainOptions.some((chain) =>
          readCachedWalletAuth(address, chain.id),
        ),
    ),
    connectError: null as Error | null,
    isConnecting,
    isConnected,
    isSigning,
    openWalletModal,
  };
}

export function readCachedWalletAuth(
  address?: string | null,
  chainInput?: ProductChainId,
) {
  if (!address || typeof window === "undefined") {
    return null;
  }

  const chain = resolveProductChain(chainInput);
  const raw = window.localStorage.getItem(
    getWalletAuthStorageKey(address, chain.id),
  );

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WalletAuth>;

    if (
      typeof parsed.address !== "string" ||
      typeof parsed.sessionExpiresAt !== "string" ||
      typeof parsed.sessionToken !== "string"
    ) {
      return null;
    }

    if (parsed.address.toLowerCase() !== address.toLowerCase()) {
      return null;
    }

    const expiresAt = new Date(parsed.sessionExpiresAt).getTime();

    if (
      Number.isNaN(expiresAt) ||
      expiresAt - Date.now() <= SESSION_REFRESH_MARGIN_MS
    ) {
      return null;
    }

    return parsed as WalletAuth;
  } catch {
    return null;
  }
}

function writeCachedWalletAuth(walletAuth: WalletAuth, chain: ProductChainId) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getWalletAuthStorageKey(walletAuth.address, chain),
    JSON.stringify(walletAuth),
  );
}

export function cacheWalletAuth(
  walletAuth: WalletAuth,
  chainInput?: ProductChainId,
) {
  const chain = resolveProductChain(chainInput);

  writeCachedWalletAuth(walletAuth, chain.id);
  dispatchWalletAuthUpdated();
}

function getWalletAuthStorageKey(address: string, chain: ProductChainId) {
  return `${WALLET_AUTH_STORAGE_PREFIX}:${chain}:${address.toLowerCase()}`;
}

function dispatchWalletAuthUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(WALLET_AUTH_UPDATED_EVENT));
}
