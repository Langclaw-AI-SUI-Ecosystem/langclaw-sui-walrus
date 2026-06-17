"use client";

import { useMemo, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  Check,
  Coins,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  getUsageVaultAdminStatus,
  getUsageVaultInfo,
  verifyUsageVaultWithdrawal,
} from "@/lib/langclaw-api";
import { useQuery } from "@tanstack/react-query";

const MIST_PER_SUI = BigInt(1_000_000_000);
const SUI_DECIMALS = 9;

function suiToMist(amount: string): bigint | null {
  const trimmed = amount.trim();

  if (!/^\d+(\.\d{0,9})?$/.test(trimmed)) {
    return null;
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const wholeMist = BigInt(whole || "0") * MIST_PER_SUI;
  const fractionMist = BigInt(fraction.padEnd(SUI_DECIMALS, "0"));
  const total = wholeMist + fractionMist;

  return total > BigInt(0) ? total : null;
}

function mistToSui(value: bigint | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  const whole = value / MIST_PER_SUI;
  const fraction = (value % MIST_PER_SUI)
    .toString()
    .padStart(SUI_DECIMALS, "0")
    .replace(/0+$/, "");

  return `${whole.toString()}${fraction ? `.${fraction}` : ""} SUI`;
}

function normalizeSuiHex(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (!/^0x[0-9a-f]{1,64}$/.test(trimmed)) {
    return null;
  }

  return `0x${trimmed.slice(2).padStart(64, "0")}`;
}

function shortAddress(value: string | null | undefined) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "-";
}

function suiVisionObject(baseUrl: string, id: string) {
  return `${baseUrl.replace(/\/+$/, "")}/object/${encodeURIComponent(id)}`;
}

function suiVisionTx(baseUrl: string, digest: string) {
  return `${baseUrl.replace(/\/+$/, "")}/txblock/${encodeURIComponent(digest)}`;
}

function readMoveField(value: unknown, field: string): unknown {
  if (!value || typeof value !== "object") {
    return null;
  }

  const root = value as {
    data?: { content?: { fields?: Record<string, unknown> } };
    content?: { fields?: Record<string, unknown> };
  };

  return root.data?.content?.fields?.[field] ?? root.content?.fields?.[field];
}

function readMistField(value: unknown, field: string) {
  const raw = readMoveField(value, field);

  if (typeof raw === "string" || typeof raw === "number") {
    try {
      return BigInt(raw);
    } catch {
      return null;
    }
  }

  return null;
}

export function AdminWithdrawDashboard() {
  const chain = resolveProductChain();
  const symbol = chain.nativeSymbol;
  const currentAccount = useCurrentAccount();
  const {
    address,
    getWalletAuth,
    isConnected,
    isSigning,
    openWalletModal,
  } = useWalletSession();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [accessCheckRequested, setAccessCheckRequested] = useState(false);
  const [recipientInput, setRecipientInput] = useState("");
  const [amount, setAmount] = useState("");
  const [digest, setDigest] = useState("");
  const [error, setError] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const accountChains = currentAccount?.chains ?? [];
  const supportsProductNetwork =
    accountChains.length === 0 ||
    accountChains.includes(`sui:${chain.network}`) ||
    accountChains.includes("sui:unknown");

  const adminStatusQuery = useQuery({
    queryKey: ["usage-vault-admin-status", chain.id, address],
    enabled: isConnected && supportsProductNetwork && accessCheckRequested,
    retry: false,
    queryFn: async () => {
      const wallet = await getWalletAuth({ chain: chain.id });

      return getUsageVaultAdminStatus(wallet, chain.id);
    },
  });
  const adminStatus = adminStatusQuery.data;
  const isAuthorized = Boolean(adminStatus?.isAdmin);

  const vaultQuery = useQuery({
    queryKey: ["usage-vault", chain.id],
    enabled: isAuthorized,
    queryFn: () => getUsageVaultInfo(chain.id),
  });

  const vault = vaultQuery.data;
  const effectiveRecipient = recipientInput || address || "";
  const adminCapObjectId = normalizeSuiHex(
    vault?.adminCapObjectId ?? adminStatus?.adminCapObjectId ?? "",
  );
  const vaultObjectId = vault?.vaultObjectId ?? adminStatus?.vaultObjectId ?? "";
  const packageId = vault?.vaultPackageId ?? adminStatus?.vaultPackageId ?? "";
  const withdrawTarget = packageId
    ? `${packageId}::usage_vault::withdraw`
    : "";
  const normalizedRecipient = normalizeSuiHex(effectiveRecipient);
  const mist = suiToMist(amount);

  const vaultObjectQuery = useSuiClientQuery(
    "getObject",
    { id: vaultObjectId, options: { showContent: true } },
    { enabled: isAuthorized && Boolean(vaultObjectId) },
  );

  const vaultBalanceMist = readMistField(vaultObjectQuery.data, "balance");
  const adminCapOwner = adminStatus?.adminCapOwner
    ? normalizeSuiHex(adminStatus.adminCapOwner)
    : null;
  const amountExceedsVault =
    mist !== null && vaultBalanceMist !== null && mist > vaultBalanceMist;
  const canWithdraw =
    isAuthorized &&
    supportsProductNetwork &&
    Boolean(withdrawTarget && vaultObjectId && adminCapObjectId) &&
    Boolean(normalizedRecipient) &&
    vaultBalanceMist !== null &&
    mist !== null &&
    !amountExceedsVault &&
    !isWithdrawing;

  const statusLabel = useMemo(() => {
    if (vaultObjectQuery.isLoading || vaultQuery.isLoading) {
      return "Reading vault";
    }

    return "Ready";
  }, [vaultObjectQuery.isLoading, vaultQuery.isLoading]);

  const isCheckingAccess =
    accessCheckRequested &&
    (adminStatusQuery.isFetching || adminStatusQuery.isLoading || isSigning);
  const accessError =
    adminStatusQuery.error instanceof Error
      ? adminStatusQuery.error.message
      : "";

  const handleVerifyAdmin = () => {
    setError("");
    setDigest("");

    if (!isConnected) {
      openWalletModal();
      return;
    }

    if (!supportsProductNetwork) {
      return;
    }

    if (accessCheckRequested) {
      void adminStatusQuery.refetch();
      return;
    }

    setAccessCheckRequested(true);
  };

  const handleWithdraw = async () => {
    if (!canWithdraw || !adminCapObjectId || !mist || !normalizedRecipient) {
      return;
    }

    setError("");
    setDigest("");
    setIsWithdrawing(true);

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: withdrawTarget,
        arguments: [
          tx.object(adminCapObjectId),
          tx.object(vaultObjectId),
          tx.pure.u64(mist),
          tx.pure.address(normalizedRecipient),
        ],
      });

      const result = await signAndExecute({ transaction: tx });
      setDigest(result.digest);
      setAmount("");

      try {
        const wallet = await getWalletAuth({ chain: chain.id });
        await verifyUsageVaultWithdrawal({
          amountMist: mist.toString(),
          chain: chain.id,
          recipient: normalizedRecipient,
          txHash: result.digest,
          wallet,
        });
        toast.success("Vault withdrawal submitted and logged");
      } catch (auditError) {
        const auditMessage =
          auditError instanceof Error
            ? auditError.message
            : "Withdrawal audit logging failed.";
        setError(
          `Withdrawal submitted, but audit logging failed: ${auditMessage}`,
        );
        toast.error("Withdrawal submitted, but audit logging failed");
      }

      await vaultObjectQuery.refetch();
    } catch (withdrawError) {
      const message =
        withdrawError instanceof Error
          ? withdrawError.message
          : "Withdrawal failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isAuthorized) {
    return (
      <AdminAccessGate
        accessError={accessError}
        chainName={chain.name}
        isChecking={isCheckingAccess}
        isConnected={isConnected}
        isNotAdmin={Boolean(adminStatus && !adminStatus.isAdmin)}
        onAction={handleVerifyAdmin}
        supportsProductNetwork={supportsProductNetwork}
        wallet={address}
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="size-4 text-primary" aria-hidden />
            Withdraw vault funds
          </CardTitle>
          <CardDescription>
            Send pooled SUI from the shared usage vault to a recipient wallet.
            This does not change user credit rows in Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Amount ({symbol})
              </span>
              <Input
                inputMode="decimal"
                placeholder="0.1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isWithdrawing}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Recipient</span>
              <Input
                spellCheck={false}
                value={effectiveRecipient}
                onChange={(event) => setRecipientInput(event.target.value)}
                disabled={isWithdrawing}
              />
            </label>
          </div>

          <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="secondary">{statusLabel}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Vault balance</span>
              <span className="font-medium">{mistToSui(vaultBalanceMist)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Admin wallet</span>
              <span className="font-mono">{shortAddress(address)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">AdminCap owner</span>
              <span className="font-mono">{shortAddress(adminCapOwner)}</span>
            </div>
          </div>

          {amount.length > 0 && mist === null && (
            <span className="text-xs text-destructive">
              Enter a positive {symbol} amount with at most {SUI_DECIMALS}{" "}
              decimals.
            </span>
          )}
          {effectiveRecipient.length > 0 && !normalizedRecipient && (
            <span className="text-xs text-destructive">
              Enter a valid Sui recipient address.
            </span>
          )}
          {amountExceedsVault && (
            <span className="text-xs text-destructive">
              Amount exceeds the current vault balance.
            </span>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Withdrawal notice</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {digest && (
            <Alert>
              <Check className="size-4" />
              <AlertTitle>Withdrawal submitted</AlertTitle>
              <AlertDescription>
                <a
                  className="inline-flex items-center gap-1 break-all font-mono text-xs text-primary hover:underline"
                  href={suiVisionTx(chain.explorerUrl, digest)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {digest}
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleWithdraw} disabled={!canWithdraw}>
            {isWithdrawing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ShieldCheck className="size-4" aria-hidden />
            )}
            Withdraw
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vault details</CardTitle>
          <CardDescription>
            Public on-chain objects used by the admin withdraw transaction.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <DetailRow label="Network" value={chain.name} />
          <DetailRow label="Package" value={packageId || "-"} />
          <DetailRow
            href={
              vaultObjectId
                ? suiVisionObject(chain.explorerUrl, vaultObjectId)
                : undefined
            }
            label="Vault"
            value={vaultObjectId || "-"}
          />
          <DetailRow
            href={
              adminCapObjectId
                ? suiVisionObject(chain.explorerUrl, adminCapObjectId)
                : undefined
            }
            label="AdminCap"
            value={adminCapObjectId || "-"}
          />
          {vaultQuery.isError && (
            <Alert variant="destructive">
              <AlertTitle>Vault unavailable</AlertTitle>
              <AlertDescription>
                Backend vault config could not be loaded.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminAccessGate({
  accessError,
  chainName,
  isChecking,
  isConnected,
  isNotAdmin,
  onAction,
  supportsProductNetwork,
  wallet,
}: {
  accessError: string;
  chainName: string;
  isChecking: boolean;
  isConnected: boolean;
  isNotAdmin: boolean;
  onAction: () => void;
  supportsProductNetwork: boolean;
  wallet?: string;
}) {
  const status = !isConnected
    ? "Wallet required"
    : !supportsProductNetwork
      ? "Wrong network"
      : isChecking
        ? "Checking access"
        : isNotAdmin
          ? "Not authorized"
          : accessError
            ? "Access check failed"
            : "Locked";
  const description = !isConnected
    ? "Connect the wallet that owns the vault AdminCap."
    : !supportsProductNetwork
      ? `Switch your Sui wallet to ${chainName}.`
      : isNotAdmin
        ? "The connected wallet does not own the configured vault AdminCap."
        : "Sign a wallet session so the backend can verify AdminCap ownership on Sui.";
  const buttonLabel = !isConnected
    ? "Connect wallet"
    : accessError || isNotAdmin
      ? "Retry access check"
      : "Verify admin access";
  const buttonDisabled = isChecking || (isConnected && !supportsProductNetwork);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          Admin access
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant={isNotAdmin || accessError ? "destructive" : "outline"}
            >
              {status}
            </Badge>
          </div>
          {wallet && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Wallet</span>
              <span className="font-mono">{shortAddress(wallet)}</span>
            </div>
          )}
        </div>

        {accessError && (
          <Alert variant="destructive">
            <AlertTitle>Admin check failed</AlertTitle>
            <AlertDescription>{accessError}</AlertDescription>
          </Alert>
        )}

        <Button onClick={onAction} disabled={buttonDisabled}>
          {isChecking ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : !isConnected ? (
            <Wallet className="size-4" aria-hidden />
          ) : (
            <ShieldCheck className="size-4" aria-hidden />
          )}
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  href,
  label,
  value,
}: {
  href?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {href ? (
        <a
          className="inline-flex items-center gap-1 break-all font-mono text-xs text-primary hover:underline"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
          <ExternalLink className="size-3 shrink-0" aria-hidden />
        </a>
      ) : (
        <span className="break-all font-mono text-xs">{value}</span>
      )}
    </div>
  );
}
