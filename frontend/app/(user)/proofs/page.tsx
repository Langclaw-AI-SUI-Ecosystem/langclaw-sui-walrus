"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FlaskConicalIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
} from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listProofDecisions,
  listStrategyRuns,
  readFriendlyError,
  type ProductChainId,
  type ProofDecision,
  type ProofDecisionsPayload,
  type StrategyRunRecord,
  type StrategyRunsPayload,
} from "@/lib/langclaw-api";
import {
  defaultProductChain,
  isProductChainId,
  productChainOptions,
  resolveProductChain,
} from "@/lib/chains";

export default function ProofsPage() {
  const [selectedChain, setSelectedChain] =
    useState<ProductChainId>(defaultProductChain);
  const [payload, setPayload] = useState<ProofDecisionsPayload | null>(null);
  const [strategyPayload, setStrategyPayload] =
    useState<StrategyRunsPayload | null>(null);
  const [error, setError] = useState("");
  const [strategyError, setStrategyError] = useState("");
  const [loading, setLoading] = useState(false);
  const chainConfig = resolveProductChain(selectedChain);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chain = params.get("chain");

    if (isProductChainId(chain)) {
      const timeoutId = window.setTimeout(() => {
        setSelectedChain(chain);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  const loadProofs = useCallback(async () => {
    setLoading(true);
    setError("");
    setStrategyError("");

    const [decisionResult, strategyResult] = await Promise.allSettled([
      listProofDecisions(25, selectedChain),
      listStrategyRuns(25, selectedChain),
    ]);

    if (decisionResult.status === "fulfilled") {
      setPayload(decisionResult.value);
    } else {
      setError(
        readFriendlyError(
          decisionResult.reason,
          "Unable to load proof decisions.",
        ),
      );
    }

    if (strategyResult.status === "fulfilled") {
      setStrategyPayload(strategyResult.value);
    } else {
      setStrategyError(
        readFriendlyError(
          strategyResult.reason,
          "Unable to load strategy journal records.",
        ),
      );
    }

    setLoading(false);
  }, [selectedChain]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProofs();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadProofs]);

  const decisions = payload?.decisions ?? [];
  const strategyRecords = strategyPayload?.records ?? [];
  const stats = useMemo(() => {
    const txCount = decisions.filter((decision) => decision.txHash).length;
    const agents = new Set(decisions.map((decision) => decision.agentId));
    const signalTypes = new Set(
      decisions.map((decision) => decision.signalType).filter(Boolean),
    );

    return {
      agents: agents.size,
      nextDecisionId: payload?.nextDecisionId ?? "0",
      signalTypes: signalTypes.size,
      txCount,
    };
  }, [decisions, payload?.nextDecisionId]);
  const strategyStats = useMemo(() => {
    const anchored = strategyRecords.filter((record) => record.txHash).length;
    const strategies = new Set(
      strategyRecords.map((record) => record.strategyId).filter(Boolean),
    );

    return {
      anchored,
      nextRecordId: strategyPayload?.nextRecordId ?? "0",
      records: strategyRecords.length,
      strategies: strategies.size,
    };
  }, [strategyPayload?.nextRecordId, strategyRecords]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Proof Center</h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            On-chain Langclaw agent decisions recorded on {chainConfig.name} for
            transparent alpha benchmarking.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            onValueChange={(value) =>
              setSelectedChain(isProductChainId(value) ? value : defaultProductChain)
            }
            value={selectedChain}
          >
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
          <Button
            disabled={loading}
            onClick={() => void loadProofs()}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCcwIcon
              className={loading ? "size-4 animate-spin" : "size-4"}
            />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Proof registry unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {strategyError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Strategy journal unavailable</AlertTitle>
          <AlertDescription>{strategyError}</AlertDescription>
        </Alert>
      )}

      <Tabs className="gap-4" defaultValue="strategy">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList className="w-full md:w-fit">
            <TabsTrigger value="strategy">
              <FlaskConicalIcon data-icon="inline-start" />
              Strategy Proofs
            </TabsTrigger>
            <TabsTrigger value="registry">
              <ShieldCheckIcon data-icon="inline-start" />
              Agent Decisions
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline">
            {chainConfig.name} chain {chainConfig.chainId}
          </Badge>
        </div>

        <TabsContent className="space-y-4" value="strategy">
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Next strategy ID" value={strategyStats.nextRecordId} />
            <MetricCard label="Strategy proofs" value={String(strategyStats.records)} />
            <MetricCard label="Journal txs" value={String(strategyStats.anchored)} />
            <MetricCard label="Strategies" value={String(strategyStats.strategies)} />
          </section>

          <Card className="rounded-lg" size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConicalIcon className="size-4 text-muted-foreground" />
                Trading Journal
              </CardTitle>
              <CardDescription className="break-all">
                {strategyPayload?.journalAddress ??
                  strategyPayload?.error ??
                  "Waiting for strategy journal response"}
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {strategyStats.anchored} anchored
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {strategyRecords.length ? (
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead>PnL</TableHead>
                      <TableHead>Recorded</TableHead>
                      <TableHead className="text-right">Proof</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategyRecords.map((record) => (
                      <StrategyRow key={record.recordId} record={record} />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {loading
                    ? "Loading strategy records..."
                    : strategyPayload?.configured === false
                      ? "Strategy journal address is not configured yet."
                      : "No strategy proof records loaded."}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="registry">
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Next decision ID" value={stats.nextDecisionId} />
            <MetricCard label="Loaded proofs" value={String(decisions.length)} />
            <MetricCard label="Explorer links" value={String(stats.txCount)} />
            <MetricCard label="Signal types" value={String(stats.signalTypes)} />
          </section>

          <Card className="rounded-lg" size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="size-4 text-muted-foreground" />
                Registry
              </CardTitle>
              <CardDescription className="break-all">
                {payload?.registryAddress ?? "Waiting for backend response"}
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">{stats.txCount} tx links</Badge>
              </CardAction>
            </CardHeader>
          </Card>

          <Card className="rounded-lg" size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="size-4 text-muted-foreground" />
                Recorded Decisions
              </CardTitle>
              <CardDescription>
                Latest registry entries used by Langclaw to prove decisions and
                outcomes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {decisions.length ? (
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Run</TableHead>
                      <TableHead>Recorded</TableHead>
                      <TableHead className="text-right">Proof</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decisions.map((decision) => (
                      <DecisionRow decision={decision} key={decision.decisionId} />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {loading
                    ? "Loading proof records..."
                    : "No proof records loaded."}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DecisionRow({ decision }: { decision: ProofDecision }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{decision.decisionId}</TableCell>
      <TableCell>
        <Badge variant="outline">{decision.signalType || "analysis"}</Badge>
      </TableCell>
      <TableCell>{decision.agentId}</TableCell>
      <TableCell className="font-mono text-xs">
        {decision.runId}
      </TableCell>
      <TableCell>
        {formatDate(decision.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        {decision.explorerUrl ? (
          <Button asChild size="sm" variant="outline">
            <a href={decision.explorerUrl} rel="noreferrer" target="_blank">
              <ExternalLinkIcon className="size-4" />
              {shortHash(decision.txHash)}
            </a>
          </Button>
        ) : (
          <span className="font-mono text-muted-foreground text-xs">
            {shortHash(decision.decisionHash)}
          </span>
        )}
      </TableCell>
    </TableRow>
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

function StrategyRow({ record }: { record: StrategyRunRecord }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{record.recordId}</TableCell>
      <TableCell>
        <Badge variant="secondary">{record.status}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{record.action}</Badge>
      </TableCell>
      <TableCell className="max-w-64 truncate font-mono text-xs">
        {record.market}
      </TableCell>
      <TableCell>{formatSignedBps(record.pnlBps)}</TableCell>
      <TableCell>{formatDate(record.createdAt)}</TableCell>
      <TableCell className="text-right">
        {record.explorerUrl ? (
          <Button asChild size="sm" variant="outline">
            <a href={record.explorerUrl} rel="noreferrer" target="_blank">
              <ExternalLinkIcon className="size-4" />
              {shortHash(record.txHash)}
            </a>
          </Button>
        ) : (
          <span className="font-mono text-muted-foreground text-xs">
            {shortHash(record.resultHash)}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

function shortHash(value?: string) {
  return value && value.length > 16
    ? `${value.slice(0, 10)}...${value.slice(-6)}`
    : value || "Not available";
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatSignedBps(value: number) {
  return `${value >= 0 ? "+" : ""}${value} bps`;
}
