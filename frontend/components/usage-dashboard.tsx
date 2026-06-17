"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Check, Coins, Loader2, ShieldCheck, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWalletSession } from "@/hooks/use-wallet-session";
import { resolveProductChain } from "@/lib/chains";
import {
  getUsageBalance,
  getUsageQuote,
  getUsageVaultInfo,
  verifyUsageDeposit,
  type UsageBalancePayload,
} from "@/lib/langclaw-api";

const MIST_PER_SUI = BigInt(1_000_000_000);
const SUI_DECIMALS = 9;
const DEPOSIT_GAS_BUFFER_MIST = BigInt(5_000_000);

function nativeAmount(value: string | undefined, symbol: string) {
  return `${value && value.trim() ? value : "0"} ${symbol}`;
}

function mistAmount(value: bigint, symbol: string) {
  const whole = value / MIST_PER_SUI;
  const fraction = (value % MIST_PER_SUI)
    .toString()
    .padStart(SUI_DECIMALS, "0")
    .replace(/0+$/, "");

  return `${whole.toString()}${fraction ? `.${fraction.slice(0, 4)}` : ""} ${symbol}`;
}

function suiVisionTx(baseUrl: string, digest: string) {
  return `${baseUrl.replace(/\/+$/, "")}/txblock/${encodeURIComponent(digest)}`;
}

/** Parse a decimal SUI string into MIST (9 decimals) without float precision loss. */
function suiToMist(amount: string): bigint | null {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;

  const [whole, frac = ""] = trimmed.split(".");
  if (frac.length > SUI_DECIMALS) return null;

  const mist =
    BigInt(whole) * MIST_PER_SUI +
    BigInt((frac + "0".repeat(SUI_DECIMALS)).slice(0, SUI_DECIMALS));

  return mist > BigInt(0) ? mist : null;
}

function readMist(value: string | undefined): bigint | null {
  if (!value || !/^\d+$/.test(value)) return null;

  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

/** Sign failures from a too-large deposit read as opaque gas errors; make them actionable. */
function toDepositErrorMessage(
  error: unknown,
  symbol: string,
  chainName: string,
): string {
  const message = error instanceof Error ? error.message : "Deposit failed.";
  if (/reject|denied|cancel/i.test(message)) {
    return "You rejected the wallet request.";
  }
  if (/gas|budget|balance|insufficient/i.test(message)) {
    return `Not enough ${symbol} to cover the deposit plus network gas. Try a smaller amount.`;
  }
  if (/unexpected error/i.test(message)) {
    return `Wallet returned an unexpected error. Check that your wallet is on ${chainName} and has enough ${symbol} for the deposit plus gas.`;
  }
  return message;
}

type DepositStage = "idle" | "signing" | "verifying";
type DepositResult = { kind: "credited" | "already"; amount: string };

// Honest usage panel: live per-run cost, the connected wallet's prepaid SUI
// credit balance (signature-gated), and a real, recoverable in-app deposit flow.
// Real numbers from the backend / chain — no mock data.
export function UsageDashboard() {
  const { address, isConnected, getWalletAuth, openWalletModal } =
    useWalletSession();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const chain = resolveProductChain();
  const symbol = chain.nativeSymbol;
  const balanceQuery = useSuiClientQuery(
    "getBalance",
    { owner: address ?? "" },
    { enabled: Boolean(address) },
  );

  const quoteQuery = useQuery({
    queryKey: ["usage-quote"],
    queryFn: () => getUsageQuote(),
  });
  const vaultQuery = useQuery({
    queryKey: ["usage-vault"],
    queryFn: () => getUsageVaultInfo(),
  });

  const [balance, setBalance] = useState<UsageBalancePayload | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const loadBalance = async () => {
    setBalanceError(null);
    setIsBalanceLoading(true);
    try {
      const auth = await getWalletAuth();
      setBalance(await getUsageBalance(auth));
    } catch (error) {
      setBalanceError(
        error instanceof Error ? error.message : "Could not load balance.",
      );
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const [amount, setAmount] = useState("");
  const [depositStage, setDepositStage] = useState<DepositStage>("idle");
  const [depositError, setDepositError] = useState<string | null>(null);
  // Held the moment the deposit lands on-chain, so a verify failure stays
  // recoverable (the credit RPC is idempotent — re-verifying never double-credits).
  const [lastDigest, setLastDigest] = useState<string | null>(null);
  const [result, setResult] = useState<DepositResult | null>(null);

  const quote = quoteQuery.data?.quote;
  const vault = vaultQuery.data;
  const vaultErrorMessage =
    vaultQuery.error instanceof Error ? vaultQuery.error.message : null;
  const depositTarget = vault?.moveCallTarget;
  const vaultObjectId = vault?.vaultObjectId;
  const mist = suiToMist(amount);
  const walletBalanceMist = readMist(balanceQuery.data?.totalBalance);
  const requiredMist = mist === null ? null : mist + DEPOSIT_GAS_BUFFER_MIST;
  const accountChains = currentAccount?.chains ?? [];
  const supportsProductNetwork =
    accountChains.length === 0 ||
    accountChains.includes(`sui:${chain.network}`) ||
    accountChains.includes("sui:unknown");
  const hasKnownInsufficientBalance =
    walletBalanceMist !== null &&
    requiredMist !== null &&
    walletBalanceMist < requiredMist;

  const isDepositing = depositStage !== "idle";
  const canDeposit =
    isConnected &&
    Boolean(depositTarget && vaultObjectId) &&
    mist !== null &&
    supportsProductNetwork &&
    !hasKnownInsufficientBalance &&
    !isDepositing;
  // Deposit landed on-chain but is not yet credited — offer recovery.
  const needsRecovery = Boolean(lastDigest && !result && depositError);

  /** Verify + credit a digest, retrying once for the node-indexing lag. Throws on
   * persistent failure (leaving lastDigest set so the caller can offer a retry). */
  const settleVerification = async (digest: string) => {
    setDepositStage("verifying");
    const auth = await getWalletAuth();

    let verified;
    try {
      verified = await verifyUsageDeposit({ txHash: digest, wallet: auth });
    } catch (firstError) {
      // The fullnode may not have indexed the digest yet — back off once.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      try {
        verified = await verifyUsageDeposit({ txHash: digest, wallet: auth });
      } catch {
        throw firstError;
      }
    }

    if (verified.credited) {
      setResult({ kind: "credited", amount: verified.amountNative ?? amount });
      setAmount("");
    } else {
      // Idempotent dedupe: the event was found but this digest was already
      // credited — do not claim a new top-up.
      setResult({ kind: "already", amount: verified.amountNative ?? "" });
    }
    setDepositError(null);
    await loadBalance();
  };

  const handleDeposit = async () => {
    if (!depositTarget || !vaultObjectId || mist === null) return;

    setDepositError(null);
    setResult(null);
    setLastDigest(null);

    try {
      setDepositStage("signing");
      const tx = new Transaction();
      // Split the deposit amount off the gas coin, then hand it to the vault.
      const [coin] = tx.splitCoins(tx.gas, [mist]);
      tx.moveCall({
        target: depositTarget,
        // deposit(vault: &mut Vault, payment: Coin<SUI>, deposit_reference: vector<u8>)
        // Empty reference: the backend only enforces a reference when one is supplied.
        arguments: [tx.object(vaultObjectId), coin, tx.pure.vector("u8", [])],
      });

      const { digest } = await signAndExecute({ transaction: tx });
      // Capture the digest BEFORE verifying so a verify failure stays recoverable.
      setLastDigest(digest);
      await settleVerification(digest);
    } catch (error) {
      setDepositError(toDepositErrorMessage(error, symbol, chain.name));
    } finally {
      setDepositStage("idle");
    }
  };

  const handleRetryCredit = async () => {
    if (!lastDigest) return;
    setDepositError(null);
    try {
      await settleVerification(lastDigest);
    } catch (error) {
      setDepositError(toDepositErrorMessage(error, symbol, chain.name));
    } finally {
      setDepositStage("idle");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="size-4 text-primary" aria-hidden />
            Per-run cost
          </CardTitle>
          <CardDescription>
            Each research run reserves an estimated cost from your prepaid {symbol}{" "}
            credits, then settles the actual amount.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {quoteQuery.isLoading ? (
            <span className="text-muted-foreground">Loading quote…</span>
          ) : quoteQuery.isError || !quote ? (
            <span className="text-muted-foreground">
              Quote unavailable right now.
            </span>
          ) : (
            <dl className="grid gap-1.5">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Estimated per run</dt>
                <dd className="font-medium">
                  {nativeAmount(quote.estimatedCostNative, symbol)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Model</dt>
                <dd className="font-mono text-xs">{quote.model}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Est. tokens</dt>
                <dd>
                  {quote.estimatedPromptTokens.toLocaleString()} in /{" "}
                  {quote.estimatedCompletionTokens.toLocaleString()} out
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            Your credit balance
          </CardTitle>
          <CardDescription>
            Prepaid {symbol} credits scoped to your wallet. Reading it needs a
            one-time wallet signature.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {!isConnected ? (
            <Button size="sm" variant="outline" onClick={openWalletModal}>
              <Wallet className="size-4" aria-hidden />
              Connect wallet
            </Button>
          ) : balance ? (
            <dl className="grid gap-1.5">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Available</dt>
                <dd className="font-medium">
                  {nativeAmount(balance.balance.availableNative, symbol)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Reserved</dt>
                <dd>{nativeAmount(balance.balance.reservedNative, symbol)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Lifetime spent</dt>
                <dd>
                  {nativeAmount(balance.balance.lifetimeChargedNative, symbol)}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="flex flex-col items-start gap-2">
              {balanceError && (
                <span className="text-destructive">{balanceError}</span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={loadBalance}
                disabled={isBalanceLoading}
              >
                {isBalanceLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <ShieldCheck className="size-4" aria-hidden />
                )}
                {isBalanceLoading ? "Signing…" : "Show my balance"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="size-4 text-primary" aria-hidden />
            Top up
          </CardTitle>
          <CardDescription>
            Deposit native {symbol} into the on-chain usage vault. Your wallet
            signs a <span className="font-mono">usage_vault::deposit</span> call;
            the backend credits your balance from the Deposited event. Withdrawals
            are admin-gated.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {!isConnected ? (
            <Button size="sm" variant="outline" onClick={openWalletModal}>
              <Wallet className="size-4" aria-hidden />
              Connect wallet to deposit
            </Button>
          ) : vaultQuery.isLoading ? (
            <span className="text-muted-foreground">Loading vault…</span>
          ) : vaultQuery.isError || !depositTarget || !vaultObjectId ? (
            <span className={vaultErrorMessage ? "text-destructive" : "text-muted-foreground"}>
              {vaultErrorMessage ?? "Vault info unavailable right now."}
            </span>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Amount ({symbol})
                  </span>
                  <Input
                    inputMode="decimal"
                    placeholder="0.1"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    disabled={isDepositing}
                    aria-invalid={amount.length > 0 && mist === null}
                  />
                </label>
                <Button onClick={handleDeposit} disabled={!canDeposit}>
                  {isDepositing ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Coins className="size-4" aria-hidden />
                  )}
                  {depositStage === "signing"
                    ? "Sign in wallet…"
                    : depositStage === "verifying"
                      ? "Crediting…"
                      : "Deposit"}
                </Button>
              </div>

              {amount.length > 0 && mist === null && (
                <span className="text-xs text-destructive">
                  Enter a positive {symbol} amount with at most {SUI_DECIMALS}{" "}
                  decimals.
                </span>
              )}

              {walletBalanceMist !== null && (
                <span className="text-xs text-muted-foreground">
                  Wallet balance: {mistAmount(walletBalanceMist, symbol)} on{" "}
                  {chain.name}.
                </span>
              )}

              {!supportsProductNetwork && (
                <span className="text-xs text-destructive">
                  Switch your Sui wallet to {chain.name}. This vault only
                  accepts {chain.name} deposits.
                </span>
              )}

              {hasKnownInsufficientBalance && requiredMist !== null && (
                <span className="text-xs text-destructive">
                  You need about {mistAmount(requiredMist, symbol)} for this
                  deposit plus gas. Add more {symbol} or enter a smaller amount.
                </span>
              )}

              {result?.kind === "credited" && (
                <div className="flex flex-col gap-1 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Check className="size-4 text-primary" aria-hidden />
                    Credited {nativeAmount(result.amount, symbol)}
                  </span>
                  {lastDigest && (
                    <a
                      className="break-all font-mono text-xs text-primary hover:underline"
                      href={suiVisionTx(chain.explorerUrl, lastDigest)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {lastDigest} ↗
                    </a>
                  )}
                </div>
              )}

              {result?.kind === "already" && (
                <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
                  <span className="font-medium text-foreground">
                    Already credited — no new balance change.
                  </span>
                  {lastDigest && (
                    <a
                      className="break-all font-mono text-xs text-primary hover:underline"
                      href={suiVisionTx(chain.explorerUrl, lastDigest)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {lastDigest} ↗
                    </a>
                  )}
                </div>
              )}

              {depositError && (
                <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <span className="text-sm text-destructive">{depositError}</span>
                  {needsRecovery && lastDigest && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        Your {symbol} is on-chain but not credited yet. Retrying is
                        safe — it re-reads the same transaction and never deposits
                        again.
                      </span>
                      <a
                        className="break-all font-mono text-xs text-primary hover:underline"
                        href={suiVisionTx(chain.explorerUrl, lastDigest)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {lastDigest} ↗
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRetryCredit}
                        disabled={isDepositing}
                      >
                        {depositStage === "verifying" ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <ShieldCheck className="size-4" aria-hidden />
                        )}
                        Retry crediting
                      </Button>
                    </>
                  )}
                </div>
              )}

              <dl className="grid gap-2 border-t pt-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">Deposit call target</dt>
                  <dd className="break-all font-mono">{depositTarget}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">Shared vault object</dt>
                  <dd className="break-all font-mono">{vaultObjectId}</dd>
                </div>
              </dl>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
