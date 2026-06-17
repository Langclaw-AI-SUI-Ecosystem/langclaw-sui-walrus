"use client";

import { useEffect, useRef, useState } from "react";
import { ConnectModal } from "@mysten/dapp-kit";

import {
  useWalletSession,
  WALLET_CONNECT_MODAL_EVENT,
} from "@/hooks/use-wallet-session";

export function WalletSessionAutoSign() {
  const {
    address,
    getWalletAuth,
    hasCachedWalletAuth,
    isConnected,
    isSigning,
  } = useWalletSession();
  const [modalOpen, setModalOpen] = useState(false);
  const promptedAddressRef = useRef<string | null>(null);

  // Open the dApp Kit connect modal whenever any surface asks for a wallet.
  useEffect(() => {
    const handleOpen = () => setModalOpen(true);

    window.addEventListener(WALLET_CONNECT_MODAL_EVENT, handleOpen);

    return () =>
      window.removeEventListener(WALLET_CONNECT_MODAL_EVENT, handleOpen);
  }, []);

  // Close the modal once a wallet connects.
  useEffect(() => {
    if (isConnected) {
      const timeoutId = window.setTimeout(() => setModalOpen(false), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [isConnected]);

  // Prompt the user to sign a session message once connected.
  useEffect(() => {
    if (!isConnected || !address) {
      promptedAddressRef.current = null;
      return;
    }

    if (hasCachedWalletAuth || isSigning) {
      return;
    }

    const normalizedAddress = address.toLowerCase();

    if (promptedAddressRef.current === normalizedAddress) {
      return;
    }

    promptedAddressRef.current = normalizedAddress;

    const timeoutId = window.setTimeout(() => {
      void getWalletAuth().catch(() => undefined);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [address, getWalletAuth, hasCachedWalletAuth, isConnected, isSigning]);

  return (
    <ConnectModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      trigger={<span aria-hidden className="hidden" />}
    />
  );
}
