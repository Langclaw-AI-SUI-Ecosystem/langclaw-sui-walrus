"use client";

import type { ReactNode } from "react";

import { ChevronDownIcon, SearchIcon, ShieldCheckIcon } from "lucide-react";

import {
  Agent,
  AgentContent,
  AgentHeader,
  AgentInstructions,
} from "@/components/ai-elements/agent";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationQuote,
  InlineCitationSource,
  InlineCitationText,
} from "@/components/ai-elements/inline-citation";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "@/components/ai-elements/plan";
import {
  Queue,
  QueueItem,
  QueueItemContent,
  QueueItemDescription,
  QueueItemIndicator,
  QueueList,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
} from "@/components/ai-elements/queue";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { buildDiscoverAnswerContent } from "@/lib/chat-utils";
import type {
  DefiRankingCoverage,
  DefiRankingMetrics,
  DiscoverPayload,
  DiscoverSignalSection,
  ResearchReport,
  ResearchReportEntity,
  WalrusMemoryProof,
  WorkflowProgressEvent,
  ZeroGProof,
} from "@/lib/langclaw-api";
import { resolveProductChain } from "@/lib/chains";
import { cn } from "@/lib/utils";

type LangclawResultProps = {
  className?: string;
  events?: WorkflowProgressEvent[];
  payload: DiscoverPayload;
  showWorkflow?: boolean;
};

export function LangclawResult({
  className,
  events = [],
  payload,
  showWorkflow = true,
}: LangclawResultProps) {
  const workflowEvents = events.length
    ? events
    : orchestrationStepsToEvents(payload);

  return (
    <div className={cn("space-y-4", className)}>
      {showWorkflow && workflowEvents.length ? (
        <WorkflowPlan events={workflowEvents} />
      ) : null}
      <MessageResponse>{buildDiscoverAnswerContent(payload)}</MessageResponse>
      <DiscoverDetails payload={payload} />
    </div>
  );
}

export function DiscoverDetails({ payload }: { payload: DiscoverPayload }) {
  const zeroG = payload.proof ?? payload.zeroG;
  const chainName = getDiscoverChainName(payload, zeroG);
  const structuredReport = payload.report ?? payload.onChain?.report;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {payload.chainContext ? (
          <>
            <StatusPill
              label="Product chain"
              value={payload.chainContext.productChain.name}
            />
            <StatusPill
              label="Analysis chain"
              value={payload.chainContext.analysisChain.name}
            />
          </>
        ) : (
          <StatusPill label="Track" value={chainName} />
        )}
        <StatusPill label="Mode" value="AI Alpha" />
        <StatusPill label="Evidence" value="Evidence-backed" />
        {payload.chainContext?.unsupportedAnalysisChain ? (
          <StatusPill
            label="Requested"
            value={`${payload.chainContext.unsupportedAnalysisChain.name} unsupported`}
          />
        ) : null}
        {zeroG?.chain.status && (
          <StatusPill
            label="Proof"
            value={
              zeroG.chain.status === "anchored" ||
              zeroG.chain.status === "pending"
                ? "On-chain recorded"
                : "Prepared"
            }
          />
        )}
        <StatusPill label="Runtime" value={payload.orchestration.runtime} />
        {payload.finalAnswerMeta?.synthesis && (
          <StatusPill
            label="Synthesis"
            value={payload.finalAnswerMeta.synthesis}
          />
        )}
        {payload.finalAnswerMeta?.requestedModel && (
          <StatusPill
            label="Requested"
            value={payload.finalAnswerMeta.requestedModel}
          />
        )}
        {(payload.finalAnswerMeta?.usedModel || payload.finalAnswerMeta?.model) && (
          <StatusPill
            label="Used"
            value={
              payload.finalAnswerMeta.usedModel ?? payload.finalAnswerMeta.model ?? ""
            }
          />
        )}
        {payload.finalAnswerMeta?.modelHonored === false && (
          <StatusPill
            label="Fallback"
            value={payload.finalAnswerMeta.fallbackFrom ?? "model fallback"}
          />
        )}
        {zeroG?.compute?.status && (
          <StatusPill label="AI compute" value={zeroG.compute.status} />
        )}
        {zeroG?.compute?.teeVerification?.status && (
          <StatusPill label="TEE" value={zeroG.compute.teeVerification.status} />
        )}
        {zeroG?.storage.status && (
          <StatusPill label="Evidence bundle" value={zeroG.storage.status} />
        )}
        {zeroG?.chain.status && (
          <StatusPill label="Agent decision proof" value={zeroG.chain.status} />
        )}
      </div>

      <Agent>
        <AgentHeader
          model={
            payload.finalAnswerMeta?.usedModel ?? payload.finalAnswerMeta?.model
          }
          name={payload.finalAnswer.generatedBy}
        />
        <AgentContent>
          <AgentInstructions>
            {`Synthesize ${chainName} alpha signals, source-backed evidence, verifier notes, and decision proof state into a concise builder-ready answer.`}
          </AgentInstructions>
        </AgentContent>
      </Agent>

      <KeySignalCitations payload={payload} />

      {payload.signals && <LiveSignalDetails payload={payload} />}

      {payload.sources.length > 0 && (
        <Sources className="rounded-md border bg-background/70 p-3">
          <SourcesTrigger count={payload.sources.length} />
          <SourcesContent>
            {payload.sources.slice(0, 8).map((source) => (
              <Source href={source.url} key={source.id} title={source.title}>
                <span className="font-medium text-foreground">
                  {source.title}
                </span>
                <span className="text-muted-foreground">{source.provider}</span>
              </Source>
            ))}
          </SourcesContent>
        </Sources>
      )}

      {structuredReport ? (
        <Collapsible className="rounded-md border bg-background/70">
          <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Structured report</p>
              <p className="text-sm text-muted-foreground">
                {structuredReport.title}
              </p>
            </div>
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t p-3">
            <ResearchReportPanel report={structuredReport} />
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      {(payload.onChain || payload.onChainSkippedReason) && (
        <Tool defaultOpen={false}>
          <ToolHeader
            state={payload.onChain ? "output-available" : "output-error"}
            title="On-chain enrichment"
            toolName="researchOnChainEnrichment"
            type="dynamic-tool"
          />
          <ToolContent>
            <div className="space-y-2 rounded-md border bg-background/70 p-3 text-sm">
              {payload.onChain ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill
                      label="Analysis chain"
                      value={payload.onChain.plan.chainName}
                    />
                    {payload.onChain.plan.productChainName ? (
                      <StatusPill
                        label="Product chain"
                        value={payload.onChain.plan.productChainName}
                      />
                    ) : null}
                    <StatusPill label="Intent" value={payload.onChain.plan.intent} />
                    <StatusPill
                      label="Tools"
                      value={String(payload.onChain.tools.length)}
                    />
                  </div>
                  <p>{payload.onChain.answer}</p>
                  <div className="space-y-1">
                    {payload.onChain.tools.slice(0, 5).map((tool) => (
                      <p key={`${tool.commandId}-${tool.provider}`}>
                        <span className="font-medium text-foreground">
                          {tool.provider}
                        </span>{" "}
                        {tool.title}: {tool.summary}
                      </p>
                    ))}
                  </div>
                </>
              ) : (
                <p>{payload.onChainSkippedReason}</p>
              )}
            </div>
          </ToolContent>
        </Tool>
      )}

      {payload.walrusMemory && (
        <WalrusMemoryDetails proof={payload.walrusMemory} />
      )}

      {payload.usage && <UsageReceipt usage={payload.usage} />}

      {zeroG && <VerificationDetails payload={payload} zeroG={zeroG} />}
    </div>
  );
}

export function WorkflowPlan({ events }: { events: WorkflowProgressEvent[] }) {
  const latest = events.at(-1);
  const isStreaming = isWorkflowStreaming(events);

  return (
    <Plan
      className="rounded-md"
      defaultOpen={isStreaming}
      isStreaming={isStreaming}
    >
      <PlanHeader>
        <div className="space-y-1">
          <PlanTitle>Langclaw workflow</PlanTitle>
          <PlanDescription>
            {latest?.summary ?? "Preparing agent workflow."}
          </PlanDescription>
        </div>
        <PlanAction>
          <PlanTrigger />
        </PlanAction>
      </PlanHeader>
      <PlanContent className="space-y-3">
        <Queue className="rounded-md shadow-none">
          <QueueSection defaultOpen>
            <QueueSectionTrigger>
              <QueueSectionLabel
                count={events.length}
                icon={<SearchIcon className="size-4" />}
                label="workflow events"
              />
            </QueueSectionTrigger>
            <QueueSectionContent>
              <QueueList>
                {events.map((event, index) => {
                  const completed = event.status === "complete";

                  return (
                    <QueueItem
                      key={`${event.stepId}-${event.status}-${event.timestamp}-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <QueueItemIndicator completed={completed} />
                        <QueueItemContent completed={completed}>
                          {event.agent}
                        </QueueItemContent>
                        <StatusPill label={event.skill} value={event.status} />
                      </div>
                      <QueueItemDescription completed={completed}>
                        {event.summary}
                        {event.execution ? ` (${event.execution})` : ""}
                      </QueueItemDescription>
                    </QueueItem>
                  );
                })}
              </QueueList>
            </QueueSectionContent>
          </QueueSection>
        </Queue>
      </PlanContent>
    </Plan>
  );
}

export function StatusPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}

/** Only allow https links through to an anchor — guards against javascript:/data:
 * scheme injection per the project security rule. */
function safeHttpsUrl(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function WalrusProofField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="break-all font-mono text-xs text-foreground">{children}</dd>
    </div>
  );
}

/** Per-run "verifiable memory" card: shows where the encrypted evidence lives on
 * Walrus, whether a store -> read-back -> hash round trip succeeded, the Seal
 * encryption mode, and the Sui anchor — with clickable, independently
 * retrievable links. Honest about local-fallback vs real Walrus network. */
export function WalrusMemoryDetails({ proof }: { proof: WalrusMemoryProof }) {
  const onWalrusNetwork = proof.walrusStorageMode === "http";
  const storageFailed = proof.storageStatus === "failed";
  // A genuine Walrus verification needs a NETWORK blob that was re-fetched and
  // hash-matched. A local-disk read-back only proves a file round-trips to
  // itself, so it must never be labeled "verified".
  const networkVerified =
    onWalrusNetwork &&
    proof.retrievalStatus === "retrieved" &&
    proof.hashVerified === true;
  const fullyAnchored = networkVerified && proof.registryStatus === "recorded";
  const blobUrl = safeHttpsUrl(proof.walrusBlobUrl);
  const txUrl = safeHttpsUrl(proof.suiTxUrl);
  const roundTrip = storageFailed
    ? "Storage failed"
    : !onWalrusNetwork
      ? proof.retrievalStatus === "retrieved"
        ? "Local read-back (not Walrus)"
        : "Not stored on Walrus"
      : proof.retrievalStatus === "retrieved"
        ? proof.hashVerified
          ? "Retrieved & hash-verified"
          : "Retrieved (hash mismatch)"
        : proof.retrievalStatus === "failed"
          ? "Not retrievable"
          : "Not requested";
  const headerTitle = fullyAnchored
    ? "Verifiable memory · Walrus + Seal + Sui"
    : onWalrusNetwork
      ? "Memory provenance · Walrus"
      : "Memory provenance · local fallback";

  return (
    <div className="space-y-3 rounded-md border bg-background/70 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <ShieldCheckIcon className="size-4" />
          {headerTitle}
        </span>
        <StatusPill
          label="Storage"
          value={
            storageFailed
              ? "Failed"
              : onWalrusNetwork
                ? "Walrus network"
                : "Local fallback"
          }
        />
        <StatusPill
          label="Encryption"
          value={
            proof.sealMode === "seal-sdk-configured"
              ? "Seal threshold"
              : "Local AES envelope"
          }
        />
        <StatusPill label="Round-trip" value={roundTrip} />
        {proof.registryStatus === "recorded" && (
          <StatusPill label="Sui proof" value="Recorded" />
        )}
        {proof.memWalStatus === "remembered" && (
          <StatusPill label="MemWal" value="Remembered" />
        )}
      </div>

      <dl className="grid gap-2 sm:grid-cols-2">
        <WalrusProofField label="Walrus blob ID">
          {blobUrl ? (
            <a
              className="text-primary underline underline-offset-2"
              href={blobUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {proof.walrusBlobId}
            </a>
          ) : (
            proof.walrusBlobId
          )}
        </WalrusProofField>
        <WalrusProofField label="Content hash">
          {proof.contentHash}
        </WalrusProofField>
        {proof.suiTxDigest && (
          <WalrusProofField label="Sui tx">
            {txUrl ? (
              <a
                className="text-primary underline underline-offset-2"
                href={txUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {proof.suiTxDigest}
              </a>
            ) : (
              proof.suiTxDigest
            )}
          </WalrusProofField>
        )}
        {proof.reusedMemoryIds.length > 0 && (
          <WalrusProofField label="Recalled prior memories">
            {String(proof.reusedMemoryIds.length)}
          </WalrusProofField>
        )}
        {(proof.reusedHandoffBlobIds?.length ?? 0) > 0 && (
          <WalrusProofField label="Agent handoffs recalled from Walrus">
            {String(proof.reusedHandoffBlobIds?.length ?? 0)} blob(s) re-fetched &
            decrypted
          </WalrusProofField>
        )}
        {proof.agentPipeline && proof.agentPipeline.length > 0 && (
          <WalrusProofField label="Agent handoffs written to Walrus">
            {proof.agentPipeline.map((handoff) => handoff.role).join(", ")}
          </WalrusProofField>
        )}
      </dl>

      {storageFailed && (
        <p className="text-xs text-destructive">
          Walrus storage failed
          {proof.storageReason ? `: ${proof.storageReason}` : ""} — the research
          result is shown but this run was not anchored.
        </p>
      )}
      {!onWalrusNetwork && !storageFailed && (
        <p className="text-xs text-muted-foreground">
          Local fallback mode — set <code>WALRUS_PUBLISHER_URL</code> and{" "}
          <code>WALRUS_AGGREGATOR_URL</code> to store on the Walrus network and
          expose a public, retrievable blob URL.
        </p>
      )}
    </div>
  );
}

export function isWorkflowStreaming(events: WorkflowProgressEvent[]) {
  const latest = events.at(-1);

  return latest?.status === "pending" || latest?.status === "running";
}

function KeySignalCitations({ payload }: { payload: DiscoverPayload }) {
  const signals = payload.finalConclusion.keySignals.filter((signal) =>
    Boolean(signal.text.trim()),
  );

  if (!signals.length) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border bg-background/70 p-3">
      <p className="font-medium text-foreground">Key signals</p>
      <div className="space-y-2">
        {signals.map((signal) => {
          const sources = getSourcesForIds(
            payload,
            signal.sourceIds?.length
              ? signal.sourceIds
              : signal.sourceId
                ? [signal.sourceId]
                : [],
          );
          const sourceUrls = sources.map((source) => source.url);

          return (
            <p key={`${signal.label}-${signal.text}`}>
              <InlineCitation>
                <InlineCitationText>
                  <span className="font-medium text-foreground">
                    {signal.label}:
                  </span>{" "}
                  {signal.text}
                </InlineCitationText>
                {sourceUrls.length > 0 && (
                  <InlineCitationCard>
                    <InlineCitationCardTrigger sources={sourceUrls} />
                    <InlineCitationCardBody>
                      <InlineCitationCarousel>
                        <InlineCitationCarouselHeader>
                          <InlineCitationCarouselPrev />
                          <InlineCitationCarouselIndex />
                          <InlineCitationCarouselNext />
                        </InlineCitationCarouselHeader>
                        <InlineCitationCarouselContent>
                          {sources.map((source) => (
                            <InlineCitationCarouselItem key={source.id}>
                              <InlineCitationSource
                                description={source.excerpt}
                                title={source.title}
                                url={source.url}
                              />
                              <InlineCitationQuote>
                                {source.provider}
                              </InlineCitationQuote>
                            </InlineCitationCarouselItem>
                          ))}
                        </InlineCitationCarouselContent>
                      </InlineCitationCarousel>
                    </InlineCitationCardBody>
                  </InlineCitationCard>
                )}
              </InlineCitation>
            </p>
          );
        })}
      </div>
    </div>
  );
}

function LiveSignalDetails({ payload }: { payload: DiscoverPayload }) {
  const signals = payload.signals;

  if (!signals) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border bg-background/70 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-foreground">Live signals</p>
        <StatusPill label="Combined" value={signals.combined.status} />
        <StatusPill label="Social" value={signals.social.status} />
        <StatusPill label="On-chain" value={signals.onchain.status} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <SignalSectionCard label="Combined" section={signals.combined} />
        <SignalSectionCard label="Social" section={signals.social} />
        <SignalSectionCard label="On-chain" section={signals.onchain} />
      </div>
    </div>
  );
}

function SignalSectionCard({
  label,
  section,
}: {
  label: string;
  section: DiscoverSignalSection;
}) {
  return (
    <div className="space-y-2 rounded-md border bg-background/80 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-foreground">{label}</p>
        <StatusPill label="Status" value={section.status} />
      </div>
      <p>{section.summary}</p>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {section.providers.length > 0 ? (
          <span>Providers: {section.providers.join(", ")}</span>
        ) : (
          <span>Providers: none</span>
        )}
        {section.sourceIds.length > 0 && (
          <span>Sources: {section.sourceIds.length}</span>
        )}
        {section.toolIds.length > 0 && (
          <span>Tools: {section.toolIds.length}</span>
        )}
      </div>
      {section.caveat ? (
        <p className="text-xs text-muted-foreground">{section.caveat}</p>
      ) : null}
    </div>
  );
}

export function ResearchReportPanel({ report }: { report: ResearchReport }) {
  return (
    <div className="space-y-3 rounded-md border bg-background/70 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{report.title}</p>
          <p className="text-sm text-muted-foreground">
            {report.executiveSummary}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Report" value={report.kind} />
          <StatusPill label="Confidence" value={report.confidence} />
          <StatusPill label="Entities" value={String(report.entities.length)} />
          <StatusPill label="Tables" value={String(report.tables.length)} />
          <StatusPill label="As of" value={formatReportTimestamp(report.asOfUtc)} />
        </div>
      </div>

      {report.entities.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {report.entities.slice(0, 6).map((entity) => {
            const defiMetrics =
              report.kind === "defi-yield"
                ? readDefiRankingMetrics(entity)
                : undefined;
            const rankingCoverage =
              defiMetrics?.coverage || readStringMetric(entity.metrics.coverage);
            const metricEntries = getEntityMetricEntries(report, entity, defiMetrics);

            return (
              <div
                className="space-y-2 rounded-md border bg-background/80 p-3 text-sm"
                key={entity.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">
                    {entity.rank}. {entity.label}
                  </p>
                  <StatusPill label="Severity" value={entity.severity} />
                  {rankingCoverage ? (
                    <StatusPill label="Ranking" value={rankingCoverage} />
                  ) : null}
                </div>
                <p>{entity.summary}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {metricEntries.map(([key, value]) => (
                    <span key={`${entity.id}-${key}`}>
                      {key}: {formatReportValue(value)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {report.tables.map((table) => (
        <div className="space-y-2" key={table.id}>
          <div>
            <p className="font-medium text-foreground">{table.title}</p>
            {table.description ? (
              <p className="text-sm text-muted-foreground">{table.description}</p>
            ) : null}
          </div>
          <div className="overflow-x-auto rounded-md border bg-background/80">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {table.columns.map((column) => (
                    <th className="px-3 py-2 font-medium text-foreground" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr
                    className="border-b last:border-b-0"
                    key={`${table.id}-${rowIndex}`}
                  >
                    {table.columns.map((column) => (
                      <td
                        className="px-3 py-2 align-top"
                        key={`${table.id}-${rowIndex}-${column}`}
                      >
                        {formatReportValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {report.sections.map((section) => (
        <div className="space-y-2" key={section.id}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{section.title}</p>
            {section.sourceIds.length > 0 ? (
              <StatusPill label="Sources" value={String(section.sourceIds.length)} />
            ) : null}
            {section.toolIds.length > 0 ? (
              <StatusPill label="Tools" value={String(section.toolIds.length)} />
            ) : null}
          </div>
          <div className="rounded-md border bg-background/80 p-3">
            <MessageResponse>{section.markdown}</MessageResponse>
          </div>
        </div>
      ))}

      <div className="space-y-2 rounded-md border bg-background/80 p-3">
        <p className="font-medium text-foreground">Bottom line</p>
        <p>{report.bottomLine}</p>
      </div>

      {report.recommendations.length > 0 ? (
        <div className="space-y-2 rounded-md border bg-background/80 p-3">
          <p className="font-medium text-foreground">Recommendations</p>
          <ul className="space-y-1 text-sm">
            {report.recommendations.map((recommendation) => (
              <li key={recommendation}>- {recommendation}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.caveats.length > 0 ? (
        <div className="space-y-2 rounded-md border bg-background/80 p-3">
          <p className="font-medium text-foreground">Caveats</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {report.caveats.map((caveat) => (
              <li key={caveat}>- {caveat}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function UsageReceipt({ usage }: { usage: DiscoverPayload["usage"] }) {
  if (!usage) {
    return null;
  }

  const symbol =
    usage.nativeSymbol ?? resolveProductChain(usage.chain).nativeSymbol;

  return (
    <div className="rounded-md border bg-background/70 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-foreground">Usage receipt</p>
        <StatusPill label="Status" value={usage.status} />
        <StatusPill label="Model" value={usage.model} />
        <StatusPill
          label="Charged"
          value={`${formatNeuron(usage.chargedNeuron)} ${symbol}`}
        />
      </div>
      <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
        <ReceiptValue label="Wallet" value={shorten(usage.wallet)} />
        <ReceiptValue label="Request" value={usage.requestId ?? "Not available"} />
        <ReceiptValue label="Provider" value={usage.provider ?? "Not available"} />
        <ReceiptValue label="Input tokens" value={formatNumber(usage.inputTokens)} />
        <ReceiptValue label="Output tokens" value={formatNumber(usage.outputTokens)} />
        <ReceiptValue
          label="Balance after"
          value={`${formatNeuron(usage.balanceAfter)} ${symbol}`}
        />
      </div>
    </div>
  );
}

function ReceiptValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/40 px-2 py-1.5">
      <p className="text-muted-foreground">{label}</p>
      <p className="truncate font-medium text-foreground">{value}</p>
    </div>
  );
}

function VerificationDetails({
  payload,
  zeroG,
}: {
  payload: DiscoverPayload;
  zeroG: ZeroGProof;
}) {
  const errorText = getZeroGError(zeroG);
  const chainName = getProofChainName(zeroG);

  return (
    <div className="space-y-3">
      <Task>
        <TaskTrigger title="Agent decision proof" />
        <TaskContent>
          <TaskItem>
            <TaskItemFile>
              <ShieldCheckIcon className="size-3" />
              Storage: {zeroG.storage.status}
            </TaskItemFile>
          </TaskItem>
          <TaskItem>
            <TaskItemFile>
              <ShieldCheckIcon className="size-3" />
              {chainName}: {zeroG.chain.status}
            </TaskItemFile>
          </TaskItem>
          <div className="grid gap-2 md:grid-cols-2">
            <ProofLink
              href={zeroG.storage.explorerUrl}
              label="Storage"
              value={zeroG.storage.txHash || zeroG.storage.rootHash}
            />
            <ProofLink
              href={zeroG.chain.explorerUrl}
              label="Decision"
              value={
                zeroG.chain.txHash ||
                zeroG.chain.decisionHash ||
                zeroG.chain.briefHash
              }
            />
          </div>
        </TaskContent>
      </Task>

      <Tool defaultOpen={false}>
        <ToolHeader
          state={getZeroGToolState(zeroG)}
          title={`${chainName} alpha evidence bundle`}
          toolName="agentDecisionProof"
          type="dynamic-tool"
        />
        <ToolContent>
          <ToolInput
            input={{
              sourceCount: payload.sources.length,
              topic: payload.topic,
            }}
          />
          <ToolOutput errorText={errorText} output={zeroG} />
        </ToolContent>
      </Tool>
    </div>
  );
}

function ProofLink({
  href,
  label,
  value,
}: {
  href?: string;
  label: string;
  value?: string;
}) {
  const content = (
    <div className="rounded-md border bg-background/70 p-2">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1 break-all">{value || "Not available"}</p>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a href={href} rel="noreferrer" target="_blank">
      {content}
    </a>
  );
}

function orchestrationStepsToEvents(
  payload: DiscoverPayload,
): WorkflowProgressEvent[] {
  return payload.orchestration.steps.map((step, index) => ({
    agent: step.agent,
    error: step.error,
    execution: step.execution,
    model: step.model,
    sessionId: step.sessionId,
    skill: step.skill,
    status: step.status,
    stepId: `${index}-${step.skill}`,
    summary: step.summary,
    timestamp: payload.generatedAt,
  }));
}

function getSourcesForIds(payload: DiscoverPayload, sourceIds: string[]) {
  if (!sourceIds.length) {
    return [];
  }

  const idSet = new Set(sourceIds);

  return payload.sources.filter((source) => idSet.has(source.id));
}

function getProofChainName(zeroG?: ZeroGProof) {
  if (zeroG?.chain.chainName) {
    return zeroG.chain.chainName;
  }

  if (zeroG?.chain.chain) {
    return resolveProductChain(zeroG.chain.chain).name;
  }

  return "Selected chain";
}

function getDiscoverChainName(payload: DiscoverPayload, zeroG?: ZeroGProof) {
  if (payload.chainContext?.analysisChain.name) {
    return payload.chainContext.analysisChain.name;
  }

  return getProofChainName(zeroG);
}

function getZeroGError(zeroG: ZeroGProof) {
  return zeroG.storage.error || zeroG.chain.error || zeroG.compute?.error;
}

function getZeroGToolState(zeroG: ZeroGProof) {
  if (
    zeroG.storage.status === "failed" ||
    zeroG.chain.status === "failed" ||
    zeroG.compute?.status === "failed"
  ) {
    return "output-error";
  }

  if (
    zeroG.storage.status === "uploaded" ||
    zeroG.chain.status === "anchored" ||
    zeroG.chain.status === "pending" ||
    zeroG.storage.status === "prepared" ||
    zeroG.chain.status === "prepared"
  ) {
    return "output-available";
  }

  return "input-available";
}

function formatNumber(value?: number) {
  return value === undefined ? "Not available" : value.toLocaleString();
}

function shorten(value: string) {
  return value.length > 14 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}

function formatNeuron(value: string) {
  try {
    const raw = BigInt(value);
    const base = BigInt("1000000000000000000");

    if (raw > BigInt(0) && raw < base / BigInt(1000000)) {
      return "<0.000001";
    }

    const whole = raw / base;
    const fraction = raw % base;
    const fractionText = fraction.toString().padStart(18, "0").slice(0, 6);

    return `${whole}.${fractionText}`.replace(/\.?0+$/, "");
  } catch {
    return value;
  }
}

function formatReportValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toFixed(2).replace(/\.?0+$/, "");
  }

  return value;
}

function formatReportTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().replace(".000Z", " UTC");
}

function readDefiRankingMetrics(
  entity: ResearchReportEntity,
): DefiRankingMetrics {
  return {
    bestApy: readNumericMetric(entity.metrics.bestApy),
    coverage: readCoverageMetric(entity.metrics.coverage),
    momentumScore: readNumericMetric(entity.metrics.momentumScore),
    poolCount: readNumericMetric(entity.metrics.poolCount),
    score: readNumericMetric(entity.metrics.score),
    tvlUsd: readNumericMetric(entity.metrics.tvlUsd),
  };
}

function getEntityMetricEntries(
  report: ResearchReport,
  entity: ResearchReportEntity,
  defiMetrics?: DefiRankingMetrics,
) {
  if (report.kind === "defi-yield" && defiMetrics) {
    return [
      ["score", defiMetrics.score],
      ["tvlUsd", defiMetrics.tvlUsd],
      ["bestApy", defiMetrics.bestApy],
      ["momentumScore", defiMetrics.momentumScore],
      ["poolCount", defiMetrics.poolCount],
    ].filter(([, value]) => value !== null && value !== undefined && value !== "");
  }

  return Object.entries(entity.metrics)
    .filter(([, value]) => value !== null && value !== "")
    .slice(0, 4);
}

function readNumericMetric(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readCoverageMetric(
  value: string | number | null | undefined,
): DefiRankingCoverage | null {
  return value === "composite" || value === "tvl+apy" || value === "context-only"
    ? value
    : null;
}

function readStringMetric(value: string | number | null | undefined) {
  return typeof value === "string" && value.trim() ? value : null;
}
