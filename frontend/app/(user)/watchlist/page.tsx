"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  BookmarkIcon,
  ExternalLinkIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
  type AlphaWatchlistItem,
} from "@/lib/alpha-watchlist";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  clearAlphaWatchlist,
  deleteAlphaWatchlistItem,
  listAlphaWatchlist,
  readFriendlyError,
} from "@/lib/langclaw-api";

export default function WatchlistPage() {
  const { getWalletAuth, isConnected, isSigning } = useWalletSession();
  const [items, setItems] = useState<AlphaWatchlistItem[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState("");

  const refreshItems = useCallback(async () => {
    if (!isConnected) {
      setItems([]);
      setLoaded(true);
      setError("");
      return;
    }

    setLoading("list");
    setError("");

    try {
      const wallet = await getWalletAuth();
      setItems(await listAlphaWatchlist(wallet));
    } catch (err) {
      const message = readFriendlyError(err, "Unable to load alpha watchlist.");
      setError(message);
      toast.error(message);
    } finally {
      setLoaded(true);
      setLoading("");
    }
  }, [getWalletAuth, isConnected]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshItems();
    }, 0);

    const handleWatchlistUpdated = () => {
      void refreshItems();
    };

    window.addEventListener(
      LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
      handleWatchlistUpdated,
    );

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(
        LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
        handleWatchlistUpdated,
      );
    };
  }, [refreshItems]);

  const stats = useMemo(() => {
    const anchored = items.filter(
      (item) => item.proofTx || item.decisionId,
    ).length;
    const sourceCount = items.reduce((total, item) => total + item.sourceCount, 0);
    const gapCount = items.reduce((total, item) => total + item.gapCount, 0);

    return { anchored, gapCount, sourceCount, total: items.length };
  }, [items]);

  const handleRemove = useCallback(
    async (item: AlphaWatchlistItem) => {
      setLoading(item.id);
      setError("");

      try {
        const wallet = await getWalletAuth();
        await deleteAlphaWatchlistItem(wallet, item.id);
        setItems((current) => current.filter((entry) => entry.id !== item.id));
        toast.success("Removed from watchlist", {
          description: item.title,
        });
      } catch (err) {
        const message = readFriendlyError(err, "Unable to remove watchlist item.");
        setError(message);
        toast.error(message);
      } finally {
        setLoading("");
      }
    },
    [getWalletAuth],
  );

  const handleClear = useCallback(async () => {
    setLoading("clear");
    setError("");

    try {
      const wallet = await getWalletAuth();
      await clearAlphaWatchlist(wallet);
      setItems([]);
      toast.success("Watchlist cleared");
    } catch (err) {
      const message = readFriendlyError(err, "Unable to clear watchlist.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading("");
    }
  }, [getWalletAuth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Alpha Watchlist</h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Saved Sui intelligence signals for follow-up review, manual
            trading decisions, and hackathon demo evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={loading === "list" || isSigning}
            onClick={() => void refreshItems()}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCcwIcon className="size-4" />
            Refresh
          </Button>
          <Button
            disabled={!items.length || loading === "clear" || isSigning}
            onClick={() => void handleClear()}
            size="sm"
            type="button"
            variant="destructive"
          >
            <Trash2Icon className="size-4" />
            Clear
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Signals" value={String(stats.total)} />
        <MetricCard label="On-chain proofs" value={String(stats.anchored)} />
        <MetricCard label="Tool evidence" value={String(stats.sourceCount)} />
        <MetricCard label="Source gaps" value={String(stats.gapCount)} />
      </section>

      {!isConnected && (
        <Alert>
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Connect wallet</AlertTitle>
          <AlertDescription>
            Alpha Watchlist is saved to Supabase per wallet. Connect a wallet
            to load saved signals.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Watchlist unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loaded && isConnected && !items.length && (
        <Alert>
          <AlertCircleIcon className="size-4" />
          <AlertTitle>No alpha signals saved yet</AlertTitle>
          <AlertDescription>
            Run Sui Intelligence in chat, then add the strongest result to
            this watchlist.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4">
        {items.map((item) => (
          <Card className="rounded-lg" key={item.id} size="sm">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <BookmarkIcon className="size-4 text-muted-foreground" />
                <span className="break-words">{item.title}</span>
              </CardTitle>
              <CardDescription className="break-words">
                {item.subject}
              </CardDescription>
              <CardAction>
                <Button
                  aria-label={`Remove ${item.title}`}
                  disabled={loading === item.id || isSigning}
                  onClick={() => void handleRemove(item)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{item.chain}</Badge>
                <Badge variant="outline">{item.signalType}</Badge>
                <Badge variant={item.gapCount ? "outline" : "secondary"}>
                  {item.sourceCount} source{item.sourceCount === 1 ? "" : "s"}
                </Badge>
                <Badge variant={item.proofTx || item.decisionId ? "secondary" : "outline"}>
                  {item.proofTx || item.decisionId ? "proof anchored" : "local signal"}
                </Badge>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
                <div className="space-y-2">
                  <p className="break-words text-sm">{item.summary}</p>
                  <p className="break-words text-muted-foreground text-sm">
                    {item.recommendation}
                  </p>
                </div>
                <div className="rounded-md border bg-muted/20 p-3 text-sm">
                  <Detail label="Added" value={formatDate(item.addedAt)} />
                  <Detail label="Intent" value={item.intent} />
                  <Detail label="Decision ID" value={item.decisionId} />
                  <Detail label="Tx" value={shortHash(item.proofTx)} />
                  <Detail label="Agent" value={item.agentId} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {item.explorerUrl && (
                  <Button asChild size="sm" variant="outline">
                    <a href={item.explorerUrl} rel="noreferrer" target="_blank">
                      <ExternalLinkIcon className="size-4" />
                      Open proof
                    </a>
                  </Button>
                )}
                <Button asChild size="sm" variant="ghost">
                  <Link href="/proofs">
                    <ShieldCheckIcon className="size-4" />
                    Proof Center
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-lg" size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 py-0.5">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium">
        {value || "Not available"}
      </span>
    </div>
  );
}

function shortHash(value?: string) {
  return value && value.length > 16
    ? `${value.slice(0, 10)}...${value.slice(-6)}`
    : value;
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
