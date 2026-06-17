"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  FlaskConicalIcon,
  PlayIcon,
  RefreshCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  openStrategyPaperTrade,
  readFriendlyError,
  runStrategyBacktest,
  scanStrategyPairs,
  type ProductChainId,
  type StrategyBacktestPayload,
  type StrategyPaperTradePayload,
  type StrategyScanCandidate,
  type StrategyScanPayload,
  type StrategyTrade,
  type TradingJournalProof,
} from "@/lib/langclaw-api";
import {
  defaultProductChain,
  isProductChainId,
  productChainOptions,
  resolveProductChain,
} from "@/lib/chains";

const samplePairs = [
  {
    label: "Momentum sample",
    value: "0x365722f12ceb2063286a268b03c654df81b7c00f",
  },
  {
    label: "Use query default",
    value: "default",
  },
];

const chartConfig = {
  equityUsd: {
    color: "var(--chart-1)",
    label: "Equity",
  },
} satisfies ChartConfig;

export default function StrategyPage() {
  const [selectedChain, setSelectedChain] =
    useState<ProductChainId>(defaultProductChain);
  const [selectedPair, setSelectedPair] = useState(samplePairs[0].value);
  const [customPair, setCustomPair] = useState("");
  const [queryId, setQueryId] = useState("");
  const [backtest, setBacktest] = useState<StrategyBacktestPayload | null>(null);
  const [paperTrade, setPaperTrade] = useState<StrategyPaperTradePayload | null>(
    null,
  );
  const [pairScan, setPairScan] = useState<StrategyScanPayload | null>(null);
  const [backtestSource, setBacktestSource] = useState<
    "" | "anchored" | "scan"
  >("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"backtest" | "paper" | "scan" | "">("");
  const chainConfig = resolveProductChain(selectedChain);

  const pairAddress = useMemo(() => {
    const custom = customPair.trim();

    if (custom) {
      return custom;
    }

    return selectedPair === "default" ? undefined : selectedPair;
  }, [customPair, selectedPair]);

  const chartData = useMemo(
    () =>
      (backtest?.equityCurve ?? []).map((point) => ({
        equityUsd: point.equityUsd,
        label: formatShortDate(point.timestamp),
      })),
    [backtest],
  );
  const latestPaperDecisionCopy = getPaperDecisionCopy(
    backtest?.latestSignal.action ?? "hold",
    chainConfig.name,
  );
  const recordedPaperDecisionCopy = getPaperDecisionCopy(
    paperTrade?.action ?? "hold",
    chainConfig.name,
  );
  const isScanPreview = backtestSource === "scan";
  const hasAnchoredBacktest = backtestSource === "anchored" && Boolean(backtest);
  const hasPaperDecision = Boolean(paperTrade);
  const demoProgress = hasPaperDecision
    ? 100
    : hasAnchoredBacktest
      ? 75
      : pairScan
        ? 50
        : 25;
  const demoSteps = [
    {
      label: "Scan",
      state: pairScan ? "done" : loading === "scan" ? "active" : "ready",
      value: pairScan ? shortHash(pairScan.selectedPairAddress) : "Ready",
    },
    {
      label: "Backtest",
      state: hasAnchoredBacktest
        ? "done"
        : loading === "backtest"
          ? "active"
          : isScanPreview
            ? "ready"
            : "locked",
      value: hasAnchoredBacktest
        ? "Anchored"
        : isScanPreview
          ? "Preview"
          : "Waiting",
    },
    {
      label: "Paper",
      state: hasPaperDecision
        ? "done"
        : loading === "paper"
          ? "active"
          : hasAnchoredBacktest
            ? "ready"
            : "locked",
      value: hasPaperDecision
        ? paperTrade?.action.toUpperCase()
        : hasAnchoredBacktest
          ? "Ready"
          : "Locked",
    },
    {
      label: "Proof",
      state: hasPaperDecision ? "done" : "locked",
      value:
        paperTrade?.proof.status === "anchored"
          ? `${paperTrade.proof.chainName ?? chainConfig.name} tx`
          : hasPaperDecision
            ? paperTrade?.proof.status
            : "Waiting",
    },
  ];
  const guidedActionLabel = !pairScan
    ? "Scan Best Pair"
    : !hasAnchoredBacktest
      ? "Anchor Backtest"
      : !hasPaperDecision
        ? latestPaperDecisionCopy.buttonLabel
        : "Open Proof Center";

  const handleRunBacktest = async () => {
    setLoading("backtest");
    setError("");
    setPaperTrade(null);

    try {
      const nextBacktest = await runStrategyBacktest({
        chain: selectedChain,
        pairAddress,
        queryId: queryId.trim() || undefined,
      });
      setBacktest(nextBacktest);
      setBacktestSource("anchored");
      toast.success("Backtest completed", {
        description: nextBacktest.title,
      });
    } catch (err) {
      const message = readFriendlyError(err, "Unable to run strategy backtest.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading("");
    }
  };

  const handleScanPairs = async () => {
    setLoading("scan");
    setError("");
    setPaperTrade(null);

    try {
      const nextScan = await scanStrategyPairs({
        chain: selectedChain,
        limit: 12,
        queryId: queryId.trim() || undefined,
      });
      setPairScan(nextScan);
      setBacktest(nextScan.bestBacktest);
      setBacktestSource("scan");
      setCustomPair(nextScan.selectedPairAddress);
      setSelectedPair("default");
      toast.success("Best pair selected", {
        description: `${shortHash(nextScan.selectedPairAddress)} scored ${nextScan.candidates[0]?.score ?? 0}. Click Run Backtest to anchor proof.`,
      });
    } catch (err) {
      const message = readFriendlyError(
        err,
        `Unable to scan ${chainConfig.name} pairs.`,
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading("");
    }
  };

  const handleUseCandidate = (candidate: StrategyScanCandidate) => {
    setSelectedPair("default");
    setCustomPair(candidate.pairAddress);
    setPaperTrade(null);

    if (
      pairScan?.bestBacktest.pairAddress.toLowerCase() ===
      candidate.pairAddress.toLowerCase()
    ) {
      setBacktest(pairScan.bestBacktest);
      setBacktestSource("scan");
    } else {
      setBacktest(null);
      setBacktestSource("");
    }

    toast.success("Pair selected", {
      description: `${shortHash(candidate.pairAddress)} is ready for Run Backtest.`,
    });
  };

  const handleOpenPaperTrade = async () => {
    if (!backtest) {
      return;
    }

    setLoading("paper");
    setError("");

    try {
      const nextPaperTrade = await openStrategyPaperTrade({
        backtest,
        chain: selectedChain,
        notionalUsd: 1_000,
      });
      const decisionCopy = getPaperDecisionCopy(
        nextPaperTrade.action,
        chainConfig.name,
      );
      setPaperTrade(nextPaperTrade);
      toast.success(decisionCopy.toastTitle, {
        description: decisionCopy.toastDescription(nextPaperTrade.market),
      });
    } catch (err) {
      const message = readFriendlyError(err, "Unable to record paper decision.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading("");
    }
  };

  const handleChainChange = (value: string) => {
    const nextChain = isProductChainId(value) ? value : defaultProductChain;

    setSelectedChain(nextChain);
    setPairScan(null);
    setBacktest(null);
    setPaperTrade(null);
    setBacktestSource("");
    setError("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Strategy Lab</h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Backtest the {chainConfig.name} Liquidity Momentum Strategy with
            Dune-sourced historical data, then record paper-trading proof on{" "}
            {chainConfig.name}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select onValueChange={handleChainChange} value={selectedChain}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Select chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {productChainOptions.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id}>
                    {chain.name} / {chain.nativeCurrency.symbol}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Badge variant="secondary">Paper trading only</Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Strategy Lab unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DemoRunway
        chainName={chainConfig.name}
        progress={demoProgress}
        steps={demoSteps}
      >
        {hasPaperDecision ? (
          <Button asChild>
            <Link href={`/proofs?chain=${selectedChain}`}>
              <ShieldCheckIcon data-icon="inline-start" />
              {guidedActionLabel}
            </Link>
          </Button>
        ) : (
          <Button
            disabled={Boolean(loading)}
            onClick={() => {
              if (!pairScan) {
                void handleScanPairs();
                return;
              }

              if (!hasAnchoredBacktest) {
                void handleRunBacktest();
                return;
              }

              void handleOpenPaperTrade();
            }}
            type="button"
          >
            {loading ? (
              <RefreshCcwIcon data-icon="inline-start" />
            ) : !pairScan ? (
              <SearchIcon data-icon="inline-start" />
            ) : !hasAnchoredBacktest ? (
              <PlayIcon data-icon="inline-start" />
            ) : (
              <ArrowUpRightIcon data-icon="inline-start" />
            )}
            {guidedActionLabel}
          </Button>
        )}
      </DemoRunway>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConicalIcon />
              Backtest setup
            </CardTitle>
            <CardDescription>
              Dune rows must include timestamp, pair address, price, liquidity,
              and volume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">{chainConfig.name} pair</span>
                <Select onValueChange={setSelectedPair} value={selectedPair}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a pair" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {samplePairs.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Custom pair address</span>
                <Input
                  onChange={(event) => setCustomPair(event.currentTarget.value)}
                  placeholder="0x..."
                  value={customPair}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Dune query ID</span>
                <Input
                  onChange={(event) => setQueryId(event.currentTarget.value)}
                  placeholder="Env query ID optional"
                  value={queryId}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  disabled={Boolean(loading)}
                  onClick={() => void handleScanPairs()}
                  type="button"
                  variant={pairScan ? "outline" : "default"}
                >
                  {loading === "scan" ? (
                    <RefreshCcwIcon data-icon="inline-start" />
                  ) : (
                    <SearchIcon data-icon="inline-start" />
                  )}
                  Scan Pairs
                </Button>
                <Button
                  disabled={Boolean(loading)}
                  onClick={() => void handleRunBacktest()}
                  type="button"
                  variant={isScanPreview ? "default" : "outline"}
                >
                  {loading === "backtest" ? (
                    <RefreshCcwIcon data-icon="inline-start" />
                  ) : (
                    <PlayIcon data-icon="inline-start" />
                  )}
                  Run Backtest
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle>Strategy rules</CardTitle>
            <CardDescription>
              Entry requires positive momentum, stronger volume, minimum
              liquidity, and non-negative smart-money flow when available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Rule label="Initial capital" value="$10,000" />
              <Rule label="Stop loss" value="5%" />
              <Rule label="Take profit" value="10%" />
              <Rule label="Max hold" value="24h" />
              <Rule label="Minimum liquidity" value="$50,000" />
              <Rule label="Minimum momentum" value="50 bps" />
            </div>
          </CardContent>
        </Card>
      </section>

      {pairScan && (
        <ScanPairsPanel
          chainName={chainConfig.name}
          onUseCandidate={handleUseCandidate}
          scan={pairScan}
        />
      )}

      {backtest ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Total PnL"
              value={formatSignedUsd(backtest.metrics.totalPnlUsd)}
            />
            <MetricCard
              label="PnL bps"
              value={formatSignedBps(backtest.metrics.totalPnlBps)}
            />
            <MetricCard
              label="Win rate"
              value={`${backtest.metrics.winRate}%`}
            />
            <MetricCard
              label="Max drawdown"
              value={`${backtest.metrics.maxDrawdownBps} bps`}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-lg" size="sm">
              <CardHeader>
                <CardTitle>Equity curve</CardTitle>
                <CardDescription>{backtest.market}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-72 w-full" config={chartConfig}>
                  <LineChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      dataKey="equityUsd"
                      dot={false}
                      stroke="var(--color-equityUsd)"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="rounded-lg" size="sm">
              <CardHeader>
                <CardTitle>Latest signal</CardTitle>
                <CardDescription>{backtest.latestSignal.rationale}</CardDescription>
                <CardAction>
                  <Badge variant="outline">
                    {backtest.latestSignal.action.toUpperCase()}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <Rule
                    label="Confidence"
                    value={`${backtest.latestSignal.confidence}%`}
                  />
                  <Rule
                    label="Price"
                    value={formatUsd(backtest.latestSignal.priceUsd)}
                  />
                  <Rule
                    label="Liquidity"
                    value={formatUsd(backtest.latestSignal.liquidityUsd)}
                  />
                  <Rule
                    label="Volume"
                    value={formatUsd(backtest.latestSignal.volumeUsd)}
                  />
                  <Alert>
                    <ShieldCheckIcon />
                    <AlertTitle>
                      {isScanPreview
                        ? "Scan preview selected"
                        : latestPaperDecisionCopy.title}
                    </AlertTitle>
                    <AlertDescription>
                      {isScanPreview
                        ? "Run Backtest to anchor this pair before recording a paper decision."
                        : latestPaperDecisionCopy.description}
                    </AlertDescription>
                  </Alert>
                  <Button
                    disabled={Boolean(loading) || isScanPreview}
                    onClick={() => void handleOpenPaperTrade()}
                    type="button"
                    variant="secondary"
                  >
                    <ArrowUpRightIcon data-icon="inline-start" />
                    {isScanPreview
                      ? "Run Backtest First"
                      : latestPaperDecisionCopy.buttonLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <StrategyProofPanel proof={backtest.proof} title="Backtest proof" />
          {paperTrade && (
            <StrategyProofPanel
              description={recordedPaperDecisionCopy.proofDescription}
              proof={paperTrade.proof}
              title={recordedPaperDecisionCopy.proofTitle}
            />
          )}

          <Card className="rounded-lg" size="sm">
            <CardHeader>
              <CardTitle>Trade log</CardTitle>
              <CardDescription>
                {backtest.trades.length
                  ? `${backtest.trades.length} simulated trade(s)`
                  : "No entries triggered by this historical window."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backtest.trades.length ? (
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">PnL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backtest.trades.map((trade) => (
                      <TradeRow
                        key={`${trade.entryAt}-${trade.exitAt}`}
                        trade={trade}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Try a more active {chainConfig.name} pair or a Dune query with
                  a wider historical window.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert>
          <AlertCircleIcon />
          <AlertTitle>No backtest yet</AlertTitle>
          <AlertDescription>
            Run the strategy with a {chainConfig.name} Dune query to generate backtest
            metrics and a paper-trade signal.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function DemoRunway({
  children,
  chainName,
  progress,
  steps,
}: {
  children: React.ReactNode;
  chainName: string;
  progress: number;
  steps: Array<{
    label: string;
    state: string;
    value?: string;
  }>;
}) {
  return (
    <section className="rounded-lg border bg-[linear-gradient(135deg,var(--accent),var(--background)_42%,var(--secondary))] p-4 shadow-xs">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-base">Strategy demo runway</h2>
            <Badge variant="outline">{chainName} verifiable</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            One guided path from pair discovery to backtest, paper decision, and
            on-chain proof.
          </p>
        </div>
        <div className="shrink-0">{children}</div>
      </div>
      <div className="mt-4">
        <Progress aria-label="Strategy demo progress" value={progress} />
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-4">
        {steps.map((step, index) => (
          <div
            className="flex min-w-0 items-center gap-3 rounded-md border bg-background/70 px-3 py-2"
            key={step.label}
          >
            <span
              className={[
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                step.state === "done"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : step.state === "active" || step.state === "ready"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {step.state === "done" ? "OK" : index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">{step.label}</p>
              <p className="truncate text-muted-foreground text-xs">
                {step.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
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

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function ScanPairsPanel({
  chainName,
  onUseCandidate,
  scan,
}: {
  chainName: string;
  onUseCandidate: (candidate: StrategyScanCandidate) => void;
  scan: StrategyScanPayload;
}) {
  const bestCandidate = scan.candidates[0];

  return (
    <Card className="rounded-lg" size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SearchIcon />
          Best {chainName} pair found
        </CardTitle>
        <CardDescription>
          Scanned {scan.scannedPairs} pair(s) from Dune query {scan.queryId}.
          Scan ranking does not write on-chain; Run Backtest anchors the chosen
          pair.
        </CardDescription>
        {bestCandidate && (
          <CardAction>
            <Badge variant="secondary">Score {bestCandidate.score}</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {bestCandidate && (
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_2fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              <Rule
                label="Selected pair"
                value={shortHash(scan.selectedPairAddress)}
              />
              <Rule
                label="Backtest PnL"
                value={formatSignedBps(bestCandidate.metrics.totalPnlBps)}
              />
              <Rule
                label="Win rate"
                value={`${bestCandidate.metrics.winRate}%`}
              />
              <Rule
                label="Latest signal"
                value={bestCandidate.latestSignal.action.toUpperCase()}
              />
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="font-medium text-sm">Why this pair</p>
              <p className="mt-1 text-muted-foreground text-sm">
                {bestCandidate.scoreReason}
              </p>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead className="text-right">PnL</TableHead>
                <TableHead className="text-right">Win</TableHead>
                <TableHead className="text-right">Drawdown</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {scan.candidates.map((candidate) => (
                <TableRow key={candidate.pairAddress}>
                  <TableCell>{candidate.rank}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{shortHash(candidate.pairAddress)}</span>
                      <span className="text-muted-foreground text-xs">
                        {candidate.rowCount} rows / score {candidate.score}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {candidate.latestSignal.action.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {candidate.metrics.tradeCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatSignedBps(candidate.metrics.totalPnlBps)}
                  </TableCell>
                  <TableCell className="text-right">
                    {candidate.metrics.winRate}%
                  </TableCell>
                  <TableCell className="text-right">
                    {candidate.metrics.maxDrawdownBps} bps
                  </TableCell>
                  <TableCell className="text-right">
                    {formatUsd(candidate.totalVolumeUsd)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => onUseCandidate(candidate)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Use
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function StrategyProofPanel({
  description,
  proof,
  title,
}: {
  description?: string;
  proof?: TradingJournalProof;
  title: string;
}) {
  if (!proof) {
    return null;
  }

  return (
    <Card className="rounded-lg" size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon />
          {title}
        </CardTitle>
        <CardDescription>
          {description && <span className="block">{description}</span>}
          <span className="block">
            Journal status: {proof.status}
            {proof.error ? ` - ${proof.error}` : ""}
          </span>
        </CardDescription>
        <CardAction>
          <Badge variant={proof.status === "anchored" ? "secondary" : "outline"}>
            {proof.strategyStatus}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <Rule label="Agent" value={proof.agentId} />
          <Rule label="Action" value={proof.action.toUpperCase()} />
          <Rule label="Record" value={proof.recordId ?? "Not anchored"} />
          <Rule label="PnL bps" value={String(proof.pnlBps)} />
          <Rule label="Decision hash" value={shortHash(proof.decisionHash)} />
          <Rule label="Result hash" value={shortHash(proof.resultHash)} />
        </div>
        {proof.explorerUrl && (
          <Button asChild className="mt-4" size="sm" variant="outline">
            <a href={proof.explorerUrl} rel="noreferrer" target="_blank">
              <ArrowUpRightIcon data-icon="inline-start" />
              Open {proof.chainName ?? "chain"} proof
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function TradeRow({ trade }: { trade: StrategyTrade }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span>{formatShortDate(trade.entryAt)}</span>
          <span className="text-muted-foreground text-xs">
            {formatUsd(trade.entryPriceUsd)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{formatShortDate(trade.exitAt)}</span>
          <span className="text-muted-foreground text-xs">
            {formatUsd(trade.exitPriceUsd)}
          </span>
        </div>
      </TableCell>
      <TableCell>{trade.reason}</TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col">
          <span>{formatSignedUsd(trade.pnlUsd)}</span>
          <span className="text-muted-foreground text-xs">
            {formatSignedBps(trade.pnlBps)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function getPaperDecisionCopy(action: string, chainName: string) {
  const normalizedAction = action.toLowerCase();
  const actionLabel = normalizedAction.toUpperCase();

  if (normalizedAction === "buy" || normalizedAction === "sell") {
    return {
      buttonLabel: "Open Paper Position",
      description: `${actionLabel} will create a simulated position and anchor the paper decision on ${chainName}. No live funds move.`,
      proofDescription: `${actionLabel} was recorded as a simulated paper position.`,
      proofTitle: "Paper position proof",
      title: "Paper position ready",
      toastDescription: (market: string) =>
        `${actionLabel} simulated position recorded for ${market}.`,
      toastTitle: "Paper position recorded",
    };
  }

  if (normalizedAction === "exit") {
    return {
      buttonLabel: "Record EXIT Decision",
      description:
        "EXIT records a simulated close decision for the strategy journal. No live funds move.",
      proofDescription: "EXIT was recorded as a simulated close decision.",
      proofTitle: "Paper exit proof",
      title: "Exit decision ready",
      toastDescription: (market: string) =>
        `EXIT paper decision recorded for ${market}.`,
      toastTitle: "EXIT decision recorded",
    };
  }

  return {
    buttonLabel: "Record HOLD Decision",
    description:
      `HOLD means the strategy is not opening a simulated position now. It records the no-position decision on ${chainName}.`,
    proofDescription: "HOLD was recorded as a no-position paper decision.",
    proofTitle: "Paper decision proof",
    title: "No paper position to open",
    toastDescription: (market: string) =>
      `HOLD no-position decision recorded for ${market}.`,
    toastTitle: "HOLD decision recorded",
  };
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: value < 10 ? 4 : 2,
    style: "currency",
  }).format(value);
}

function formatSignedUsd(value: number) {
  return `${value >= 0 ? "+" : ""}${formatUsd(value)}`;
}

function formatSignedBps(value: number) {
  return `${value >= 0 ? "+" : ""}${value} bps`;
}

function formatShortDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
      });
}

function shortHash(value: string) {
  return value.length > 16
    ? `${value.slice(0, 10)}...${value.slice(-6)}`
    : value;
}
