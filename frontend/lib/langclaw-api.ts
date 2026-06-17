export type SourceType =
  | "x_post"
  | "github_repo"
  | "docs_page"
  | "hackquest_hackathon"
  | "hackquest_project";

export type ProviderName =
  | "X"
  | "GitHub"
  | "Tavily"
  | "HackQuest"
  | "Surf"
  | "Nansen"
  | "Elfa";

export type ProviderTraceStatus = "success" | "failed" | "skipped";

export type ProviderTraceScope =
  | "sui-premium"
  | "legacy-fallback"
  | "legacy-default"
  | "out-of-scope";

export type ProviderTraceEntry = {
  provider: string;
  status: ProviderTraceStatus;
  scope: ProviderTraceScope;
  message: string;
  sourceCount?: number;
};

export type SourceCard = {
  id: string;
  type: SourceType;
  title: string;
  url: string;
  author?: string;
  publishedAt?: string;
  excerpt: string;
  metrics?: Record<string, string | number | undefined>;
  provider: ProviderName;
};

export type ProviderError = {
  provider: ProviderName;
  message: string;
};

export type StepExecution =
  | "openclaw-agent"
  | "typescript-tool"
  | "openai"
  | "evidence-bundle"
  | "chain-proof"
  | "analysis-chain"
  | "deterministic-fallback";

export type WorkflowProgressEvent = {
  stepId: string;
  agent: string;
  skill: string;
  status: "pending" | "running" | "complete" | "failed";
  summary: string;
  timestamp: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  execution?: StepExecution;
  model?: string;
  sessionId?: string;
  error?: string;
};

export type OrchestrationStep = {
  agent: string;
  skill: string;
  status: "complete" | "failed";
  summary: string;
  execution?: StepExecution;
  model?: string;
  sessionId?: string;
  error?: string;
};

export type FinalConclusion = {
  headline: string;
  summary: string;
  keySignals: Array<{
    label: string;
    text: string;
    sourceId?: string;
    sourceIds: string[];
  }>;
  recommendation: string;
  qualityNote: string;
  generatedBy: "Final Conclusion Agent";
};

export type FinalAnswer = {
  title?: string;
  answer: string;
  answerMarkdown?: string;
  bullets: string[];
  recommendation?: string;
  caveat?: string;
  generatedBy: "Final Conclusion Agent";
};

export type FinalAnswerMeta = {
  synthesis: "openai" | "openclaw-ai" | "deterministic-fallback";
  execution?: StepExecution;
  model?: string;
  requestedModel?: string;
  usedModel?: string;
  modelHonored?: boolean;
  sessionId?: string;
  transport?: string;
  fallbackFrom?: string;
  error?: string;
};

export type DiscoverSignalStatus =
  | "success"
  | "partial"
  | "skipped"
  | "failed";

export type DiscoverSignalSection = {
  status: DiscoverSignalStatus;
  summary: string;
  providers: string[];
  sourceIds: string[];
  toolIds: string[];
  caveat?: string;
};

export type DiscoverSignals = {
  social: DiscoverSignalSection;
  onchain: DiscoverSignalSection;
  combined: DiscoverSignalSection;
};

export type ResearchReportKind =
  | "liquidity-anomaly"
  | "smart-money"
  | "market-brief"
  | "defi-yield"
  | "token-discovery"
  | "mixed-research";

export type ResearchReportSeverity =
  | "high"
  | "medium"
  | "watch"
  | "fragile"
  | "info";

export type ResearchReportConfidence =
  | "high"
  | "medium"
  | "low"
  | "insufficient";

export type DefiRankingCoverage =
  | "composite"
  | "tvl+apy"
  | "context-only";

export type DefiRankingMetrics = {
  score?: number | null;
  tvlUsd?: number | null;
  bestApy?: number | null;
  momentumScore?: number | null;
  poolCount?: number | null;
  coverage?: DefiRankingCoverage | null;
};

export type ResearchReportEntity = {
  id: string;
  label: string;
  category: string;
  rank: number;
  severity: ResearchReportSeverity;
  summary: string;
  metrics: Record<string, string | number | null>;
  sourceIds: string[];
  toolIds: string[];
};

export type ResearchReportTable = {
  id: string;
  title: string;
  description?: string;
  columns: string[];
  rows: Array<Record<string, string | number | null>>;
};

export type ResearchReportSection = {
  id: string;
  title: string;
  markdown: string;
  sourceIds: string[];
  toolIds: string[];
};

export type ResearchReport = {
  kind: ResearchReportKind;
  title: string;
  asOfUtc: string;
  executiveSummary: string;
  bottomLine: string;
  confidence: ResearchReportConfidence;
  entities: ResearchReportEntity[];
  tables: ResearchReportTable[];
  sections: ResearchReportSection[];
  caveats: string[];
  recommendations: string[];
};

export type ZeroGStorageStatus = "prepared" | "uploaded" | "skipped" | "failed";
export type ZeroGChainStatus =
  | "prepared"
  | "pending"
  | "anchored"
  | "skipped"
  | "failed";
export type ZeroGComputeStatus = "used" | "skipped" | "failed";

export type ZeroGTokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  maxTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ZeroGComputeBilling = {
  inputCostNeuron?: string;
  outputCostNeuron?: string;
  totalCostNeuron?: string;
  source: "router-trace" | "token-estimate" | "reserved-estimate";
};

export type ZeroGTeeVerification = {
  requested: boolean;
  routerVerified?: boolean | null;
  independentVerified?: boolean | null;
  status:
    | "not-requested"
    | "router-verified"
    | "router-unverified"
    | "router-missing"
    | "independent-verified"
    | "independent-failed"
    | "independent-unavailable"
    | "independent-error";
  chatId?: string;
  error?: string;
};

export type ZeroGProof = {
  storage: {
    status: ZeroGStorageStatus;
    evidenceUri: string;
    rootHash?: string;
    txHash?: string;
    explorerUrl?: string;
    indexerRpc?: string;
    error?: string;
  };
  chain: {
    status: ZeroGChainStatus;
    briefHash: string;
    chain?: ProductChainId;
    decisionHash?: string;
    decisionId?: string;
    agentId?: string;
    signalType?: string;
    txHash?: string;
    explorerUrl?: string;
    registryAddress?: string;
    chainId?: number;
    chainName?: string;
    nativeSymbol?: string;
    error?: string;
  };
  compute?: {
    status: ZeroGComputeStatus;
    model?: string;
    requestedModel?: string;
    usedModel?: string;
    modelHonored?: boolean;
    fallbackFrom?: string;
    endpoint?: string;
    chatId?: string;
    requestId?: string;
    provider?: string;
    teeVerified?: boolean | null;
    teeVerification?: ZeroGTeeVerification;
    usage?: ZeroGTokenUsage;
    billing?: ZeroGComputeBilling;
    error?: string;
  };
};

export type ModelUsageReceipt = {
  wallet: string;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  nativeSymbol?: string;
  model: string;
  requestId?: string;
  provider?: string;
  teeVerified?: boolean | null;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  maxTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  promptPriceNeuron: string;
  completionPriceNeuron: string;
  reservedNeuron: string;
  rawCostNeuron: string;
  markupBps: number;
  markupNeuron: string;
  chargedNeuron: string;
  releasedNeuron: string;
  balanceBefore: string;
  balanceAfter: string;
  costSource: "router-trace" | "token-estimate" | "reserved-estimate";
  meter?: Record<string, unknown>;
  totalCostNeuron?: string;
  status: "charged" | "estimated" | "refunded" | "failed_after_charge";
};

export type ChatMode = "chat" | "onchain" | "research";
export type ProductChainId = "sui-testnet" | "sui-mainnet";

export type DirectChatUsage = ZeroGTokenUsage & {
  meter?: Record<string, unknown>;
  model: string;
  totalCostNeuron?: string;
};

export type WorkflowChainContext = {
  productChain: {
    id: string;
    name: string;
    chainId: number;
    nativeSymbol: string;
  };
  analysisChain: {
    id: string;
    name: string;
    chainId: number;
    nativeSymbol?: string;
    source: "product-fallback" | "prompt";
    supported: boolean;
  };
  unsupportedAnalysisChain?: {
    id: string;
    name: string;
  };
};

/** Verifiable-memory proof emitted per research run: the encrypted evidence is
 * stored on Walrus (Seal-encrypted), re-fetched and hash-verified, and anchored
 * on Sui. Mirrors the backend `WalrusMemoryProof`. */
export type WalrusMemoryProof = {
  runId: string;
  topic: string;
  contentHash: string;
  walrusBlobId: string;
  walrusObjectId: string;
  sealPolicyId: string;
  sealMode: "local-envelope" | "seal-sdk-configured";
  storageStatus: "prepared" | "uploaded" | "failed";
  storageReason?: string;
  retrievalStatus: "not_requested" | "retrieved" | "failed";
  hashVerified?: boolean;
  walrusStorageMode?: "http" | "local";
  walrusBlobUrl?: string;
  suiNetwork?: "testnet" | "mainnet" | "devnet" | "localnet";
  suiTxDigest?: string;
  suiTxUrl?: string;
  registryStatus: "recorded" | "skipped" | "failed";
  registryReason?: string;
  memWalStatus: "remembered" | "skipped" | "failed";
  memWalReason?: string;
  memWalBlobId?: string;
  memWalRecalledBlobIds: string[];
  reusedMemoryIds: string[];
  reusedHandoffBlobIds?: string[];
  agentPipeline?: Array<{ role: string; walrusBlobId: string }>;
  createdAt: string;
};

export type DiscoverPayload = {
  topic: string;
  generatedAt: string;
  chainContext?: WorkflowChainContext;
  sources: SourceCard[];
  errors: ProviderError[];
  providerTrace?: ProviderTraceEntry[];
  signals?: DiscoverSignals;
  report?: ResearchReport;
  onChain?: OnChainToolFinalPayload;
  onChainSkippedReason?: string;
  orchestration: {
    runtime: "openclaw" | "typescript";
    steps: OrchestrationStep[];
  };
  finalConclusion: FinalConclusion;
  finalAnswer: FinalAnswer;
  finalAnswerMeta?: FinalAnswerMeta;
  agentOutputs?: {
    planner?: {
      summary: string;
      providerPlan: Array<{
        provider: ProviderName;
        query: string;
        purpose: string;
      }>;
      scoringFocus: string[];
    };
    trend?: {
      summary: string;
      topTrend: string;
      score: number;
      rankedTrends: Array<{
        label: string;
        score: number;
        why: string;
        sourceIds: string[];
      }>;
    };
    evidence?: {
      bundleSummary: string;
      storageStatus: ZeroGStorageStatus;
      evidenceUri: string;
      rootHash?: string;
      storageTxHash?: string;
      storageExplorerUrl?: string;
      error?: string;
      claimMap: Array<{
        claim: string;
        sourceIds: string[];
      }>;
    };
    verifier?: {
      verificationSummary: string;
      unsupportedClaims: string[];
      briefHashInput: string;
      storageStatus: ZeroGStorageStatus;
      chainStatus: ZeroGChainStatus;
      chainTxHash?: string;
      chainExplorerUrl?: string;
      registryAddress?: string;
      error?: string;
    };
  };
  proof?: ZeroGProof;
  zeroG?: ZeroGProof;
  walrusMemory?: WalrusMemoryProof;
  reusedMemories?: Array<{
    id: string;
    topic: string;
    walrusBlobId: string;
    contentHash: string;
    createdAt: string;
  }>;
  usage?: ModelUsageReceipt;
};

export type DirectChatPayload = {
  answer: string;
  model?: string;
  requestedModel?: string;
  usedModel?: string;
  fallbackFrom?: string;
  modelHonored?: boolean;
  source?: "openai" | "fallback";
  teeVerified?: boolean | null;
  teeVerification?: ZeroGTeeVerification;
  title?: string;
  usage?: DirectChatUsage;
  error?: string;
};

export type OnChainDomain =
  | "token_discovery"
  | "market_data"
  | "pair_liquidity"
  | "wallet_portfolio"
  | "wallet_pnl"
  | "smart_money"
  | "defi_tvl"
  | "yield_pools"
  | "token_security"
  | "honeypot_detection"
  | "address_approval_risk"
  | "social_sentiment"
  | "raw_onchain_query"
  | "trading_signal_analysis";

export type OnChainProvider =
  | "alchemy"
  | "coingecko"
  | "defillama"
  | "dexscreener"
  | "dune"
  | "elfa"
  | "etherscan"
  | "geckoterminal"
  | "goplus"
  | "local"
  | "nansen"
  | "surf";

export type OnChainPlanSummary = {
  analysisSource?: "product-fallback" | "prompt";
  capabilities?: {
    chain: string;
    chainName: string;
    marketData: unknown;
    notes: string[];
    security: unknown;
    smartMoney: unknown;
    structuredOnChain: string;
  };
  intent: string;
  chain: string;
  chainId: number;
  chainName: string;
  commands: Array<{
    commandId: string;
    domain: OnChainDomain;
    provider: OnChainProvider;
    reason: string;
    title: string;
  }>;
  domainCount: number;
  nativeSymbol: string;
  providerGaps?: string[];
  providerTrace?: ProviderTraceEntry[];
  productChain?: ProductChainId;
  productChainId?: number;
  productChainName?: string;
  rawQuery?: string;
  query?: string;
  registryCommandCount: number;
  tokenAddress?: string;
  walletAddress?: string;
};

export type OnChainToolCallEvent = {
  commandId: string;
  domain: OnChainDomain;
  provider: OnChainProvider;
  reason: string;
  title: string;
};

export type OnChainToolResult = {
  attemptedProviders?: OnChainProvider[];
  commandId: string;
  data?: unknown;
  domain: OnChainDomain;
  error?: string;
  fallbackReason?: string;
  latencyMs: number;
  provider: OnChainProvider;
  scope?: ProviderTraceScope;
  sourceUrl?: string;
  status: "failed" | "skipped" | "success";
  summary: string;
  title: string;
};

export type OnChainToolFinalPayload = {
  answer: string;
  bullets: string[];
  caveat: string;
  generatedAt: string;
  plan: OnChainPlanSummary;
  providerTrace?: ProviderTraceEntry[];
  proof?: ZeroGProof;
  recommendation: string;
  report?: ResearchReport;
  title: string;
  tools: OnChainToolResult[];
  usage?: ModelUsageReceipt;
};

export type StoredChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  chain?: ProductChainId;
  mode?: ChatMode;
  model?: string;
  result?: DiscoverPayload;
  directAnswer?: DirectChatPayload;
  onChain?: OnChainToolFinalPayload;
  progressEvents?: WorkflowProgressEvent[];
  error?: string;
  stopped?: boolean;
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  messages: StoredChatMessage[];
};

export type WalletAuth = {
  address: string;
  message?: string;
  sessionExpiresAt?: string;
  sessionToken?: string;
  signature?: string;
};

export type WalletAuthPurpose = "api-key:create" | "session";

export type WalletChallenge = {
  address: string;
  chainId: number;
  domain: string;
  expiresAt: string;
  issuedAt: string;
  message: string;
  nonce: string;
  purpose: WalletAuthPurpose;
  uri: string;
};

export type ApiKeyRecord = {
  id: string;
  name: string;
  prefix?: string;
  suffix?: string;
  maskedKey: string;
  status: "active" | "revoked" | (string & {});
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
};

export type ApiKeyCreatePayload = {
  configured: true;
  key: ApiKeyRecord;
  secret: string;
};

export type AutomationTriggerType = "schedule" | "event" | "webhook";
export type AutomationFrequency = "daily" | "weekly" | "monthly";
export type AutomationTaskStatus = "draft" | "active" | "paused" | "archived";
export type AutomationRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "canceled";
export type AutomationTriggeredBy =
  | "schedule"
  | "event"
  | "webhook"
  | "manual"
  | "system";
export type AutomationNotificationChannel = "email" | "telegram" | "in-app";
export type AutomationInAppNotificationStatus = "unread" | "read";

export type AutomationSettings = {
  retryPolicy: "none" | "3-attempts" | "5-attempts";
  failureNotification: "email" | "in-app" | "none";
  notificationChannels: AutomationNotificationChannel[];
  notificationEmail?: string;
  notificationEmailLinkedAt?: string;
  notificationEmailPending?: string;
  notificationEmailVerified: boolean;
  telegramChatId?: string;
  telegramLinkedAt?: string;
  telegramUsername?: string;
  telegramVerified: boolean;
  autoPauseRepeatedFailures: boolean;
  developerModeEnabled: boolean;
  writeRunLogsToMemory: boolean;
  dailyLimit0G: string;
  monthlyCap0G: string;
  limitBehavior: "pause" | "alert" | "allow";
  lowBalanceThreshold0G: string;
  thresholdAction: "notify" | "pause" | "continue";
};

export type AutomationTask = {
  id: string;
  name: string;
  project: string;
  prompt?: string;
  model?: string;
  triggerType: AutomationTriggerType;
  scheduleFrequency?: AutomationFrequency;
  scheduleTime: string;
  scheduleWeekday?: number;
  scheduleMonthDay?: number;
  timezone: string;
  eventName?: string;
  webhookSlug?: string;
  status: AutomationTaskStatus;
  displayStatus: "Draft" | "Active" | "Paused" | "Running";
  triggerLabel: string;
  lastRunAt?: string;
  lastRunStatus?: AutomationRunStatus;
  nextRunAt?: string;
  consecutiveFailures: number;
  maxRetries: number;
  failureThreshold: number;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export type AutomationRun = {
  id: string;
  taskId: string;
  taskName?: string;
  status: AutomationRunStatus;
  triggeredBy: AutomationTriggeredBy;
  attempt: number;
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  result?: unknown;
  usage?: unknown;
  createdAt: string;
};

export type AutomationInAppNotification = {
  id: string;
  title: string;
  body: string;
  status: AutomationInAppNotificationStatus;
  taskId?: string;
  runId?: string;
  metadata: unknown;
  readAt?: string;
  createdAt: string;
};

export type AutomationStats = {
  activeTasks: number;
  scheduledTasks: number;
  eventTasks: number;
  runningNow: number;
  successRate: number;
  nextRunAt?: string;
  nextRunTaskName?: string;
  pendingRuns: number;
  completedThisWeek: number;
};

export type MemoryStatus = "active" | "disabled";
export type MemoryCategory =
  | "Preference"
  | "Project"
  | "Workflow"
  | "Personal"
  | "API";

export type MemoryItem = {
  id: string;
  memory: string;
  category: MemoryCategory;
  scope: string;
  status: MemoryStatus;
  source: string;
  lastUsed: string;
  updatedAt: string;
  confidence: number;
};

export type MemoryStats = {
  active: number;
  disabled: number;
  projectScoped: number;
  total: number;
};

export type MemorySettings = {
  autoDisableLowConfidence: boolean;
  captureEnabled: boolean;
  crossChatRecall: boolean;
  projectScopedRecall: boolean;
  retentionDays: number;
  updatedAt: string;
};

export type MemoryDashboard = {
  configured: true;
  memories: MemoryItem[];
  settings: MemorySettings;
  stats: MemoryStats;
};

export type MemorySettingsInput = Partial<
  Pick<
    MemorySettings,
    | "autoDisableLowConfidence"
    | "captureEnabled"
    | "crossChatRecall"
    | "projectScopedRecall"
    | "retentionDays"
  >
>;

export type AutomationDashboard = {
  configured: true;
  notifications: AutomationInAppNotification[];
  tasks: AutomationTask[];
  recentRuns: AutomationRun[];
  settings: AutomationSettings;
  stats: AutomationStats;
};

export type AutomationTaskInput = {
  name?: string;
  project?: string;
  prompt?: string;
  model?: string;
  triggerType?: AutomationTriggerType;
  scheduleFrequency?: AutomationFrequency;
  scheduleTime?: string;
  scheduleWeekday?: number;
  scheduleMonthDay?: number;
  timezone?: string;
  eventName?: string;
  status?: Extract<AutomationTaskStatus, "draft" | "active" | "paused">;
};

export type AutomationSettingsInput = Partial<
  Pick<
    AutomationSettings,
    | "autoPauseRepeatedFailures"
    | "dailyLimit0G"
    | "developerModeEnabled"
    | "failureNotification"
    | "limitBehavior"
    | "lowBalanceThreshold0G"
    | "monthlyCap0G"
    | "notificationChannels"
    | "notificationEmail"
    | "retryPolicy"
    | "telegramChatId"
    | "thresholdAction"
    | "writeRunLogsToMemory"
  >
>;

export type ChatStreamInput = {
  chain?: ProductChainId;
  message: string;
  messages?: Array<Pick<StoredChatMessage, "role" | "content">>;
  model?: string;
  researchTrend?: boolean;
  sessionId?: string;
  toolMode?: ChatMode;
  wallet?: WalletAuth;
  signal?: AbortSignal;
  onDirectDelta?: (delta: string) => void;
  onDirectReasoningDelta?: (delta: string) => void;
  onDirect?: (payload: DirectChatPayload) => void;
  onMode?: (mode: string) => void;
  onToolCall?: (event: OnChainToolCallEvent) => void;
  onToolFinal?: (payload: OnChainToolFinalPayload) => void;
  onToolPlan?: (plan: OnChainPlanSummary) => void;
  onToolResult?: (event: OnChainToolResult) => void;
  onProgress?: (event: WorkflowProgressEvent) => void;
  onResult?: (payload: DiscoverPayload) => void;
  onError?: (message: string) => void;
};

export type ChatStreamChunk =
  | {
      type: "direct_delta";
      delta?: string;
    }
  | {
      type: "direct_reasoning_delta";
      delta?: string;
    }
  | {
      type: "direct";
      payload?: DirectChatPayload;
    }
  | {
      type: "mode";
      mode?: string;
    }
  | {
      type: "tool_plan";
      plan?: OnChainPlanSummary;
    }
  | {
      type: "tool_call";
      event?: OnChainToolCallEvent;
    }
  | {
      type: "tool_result";
      event?: OnChainToolResult;
    }
  | {
      type: "tool_final";
      payload?: OnChainToolFinalPayload;
    }
  | {
      type: "progress";
      event?: WorkflowProgressEvent;
    }
  | {
      type: "result";
      payload?: DiscoverPayload;
    }
  | {
      type: "error";
      error?: string;
    };

export type DiscoverStreamInput = {
  topic: string;
  wallet?: WalletAuth;
  signal?: AbortSignal;
  onProgress?: (event: WorkflowProgressEvent) => void;
  onResult?: (payload: DiscoverPayload) => void;
  onError?: (message: string) => void;
};

export type DiscoverStreamChunk =
  | {
      type: "progress";
      event?: WorkflowProgressEvent;
    }
  | {
      type: "result";
      payload?: DiscoverPayload;
    }
  | {
      type: "error";
      error?: string;
    };

export type UsageBalance = {
  chain?: ProductChainId;
  chainId?: number;
  nativeSymbol?: string;
  availableNeuron: string;
  available0G: string;
  availableNative?: string;
  reservedNeuron: string;
  reserved0G: string;
  reservedNative?: string;
  lifetimeDepositedNeuron: string;
  lifetimeDeposited0G: string;
  lifetimeDepositedNative?: string;
  lifetimeChargedNeuron: string;
  lifetimeCharged0G: string;
  lifetimeChargedNative?: string;
};

export type UsageQuote = {
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  model: string;
  nativeSymbol?: string;
  endpoint: string;
  promptPriceNeuron: string;
  completionPriceNeuron: string;
  imagePriceNeuron?: string;
  promptPriceUsd?: string;
  completionPriceUsd?: string;
  imagePriceUsd?: string;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  estimatedCostNeuron: string;
  estimatedCost0G: string;
  estimatedCostNative?: string;
  priceFetchedAt: string;
};

export type UsageBalancePayload = {
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  configured: true;
  nativeSymbol?: string;
  wallet: string;
  balance: UsageBalance;
  quote?: UsageQuote;
};

export type UsageQuotePayload = {
  configured: true;
  quote: UsageQuote;
};

export type UsageDepositVerifyPayload = {
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  configured: true;
  nativeSymbol?: string;
  wallet: string;
  walletSession?: WalletAuth;
  txHash: string;
  amountNeuron: string;
  amount0G: string;
  amountNative?: string;
  credited: boolean;
  balanceBefore: string;
  balanceAfter: string;
};

export type UsageWithdrawRequestPayload = {
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  configured: true;
  billingCurrency?: {
    decimals: number;
    feeCurrencyAddress?: string;
    name: string;
    symbol: string;
    tokenAddress?: string;
  };
  depositFunctionName?: "deposit" | "depositTokenAmount";
  nativeSymbol?: string;
  wallet: string;
  vaultAddress: string;
  functionName: "withdraw";
  balance: UsageBalance;
  note: string;
};

export type UsageVaultInfoPayload = {
  adminCapObjectId?: string;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  configured: true;
  billingCurrency?: {
    decimals: number;
    feeCurrencyAddress?: string;
    name: string;
    symbol: string;
    tokenAddress?: string;
  };
  depositFunctionName?: "deposit" | "depositTokenAmount";
  nativeSymbol?: string;
  vaultAddress: string;
  // Sui usage_vault deposit target (native SUI). buildUsageVaultInfo returns
  // these on Sui; the legacy EVM `vaultAddress` is empty there.
  vaultPackageId?: string;
  vaultObjectId?: string;
  vaultObjectType?: string;
  moveCallTarget?: string;
  module?: string;
  network?: string;
};

export type UsageVaultAdminStatusPayload = {
  adminCapObjectId: string;
  adminCapOwner?: string;
  adminCapType?: string;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  configured: true;
  isAdmin: boolean;
  nativeSymbol?: string;
  network?: string;
  vaultObjectId: string;
  vaultPackageId: string;
  wallet: string;
};

export type UsageVaultWithdrawalVerifyPayload = {
  amountNative: string;
  amountNeuron: string;
  balanceAfterNative: string;
  balanceAfterNeuron: string;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  configured: true;
  nativeSymbol?: string;
  recorded: true;
  recipient: string;
  txHash: string;
  wallet: string;
};

export type ProofDecision = {
  agentId: string;
  createdAt: string;
  decisionHash: string;
  decisionId: string;
  evidenceUri: string;
  explorerUrl?: string;
  recorder: string;
  runId: string;
  signalType: string;
  txHash?: string;
};

export type ProofDecisionsPayload = {
  chain?: ProductChainId;
  chainId: number;
  chainName?: string;
  configured: true;
  decisions: ProofDecision[];
  nativeSymbol?: string;
  nextDecisionId: string;
  registryAddress: string;
};

export type StrategyAction = "buy" | "sell" | "hold" | "exit";

export type StrategyRecordStatus =
  | "backtested"
  | "paper-opened"
  | "paper-closed";

export type StrategyBacktestParams = {
  initialCapitalUsd: number;
  maxHoldHours: number;
  minLiquidityUsd: number;
  minMomentumBps: number;
  minVolumeMultiple: number;
  stopLossBps: number;
  takeProfitBps: number;
};

export type StrategyMarketBar = {
  liquidityUsd: number;
  netWhaleFlowUsd?: number;
  pairAddress: string;
  priceUsd: number;
  timestamp: string;
  txCount?: number;
  volumeUsd: number;
};

export type StrategyTrade = {
  entryAt: string;
  entryPriceUsd: number;
  exitAt: string;
  exitPriceUsd: number;
  holdHours: number;
  pnlBps: number;
  pnlUsd: number;
  reason: string;
};

export type StrategyEquityPoint = {
  equityUsd: number;
  timestamp: string;
};

export type StrategyMetrics = {
  finalEquityUsd: number;
  initialCapitalUsd: number;
  maxDrawdownBps: number;
  totalPnlBps: number;
  totalPnlUsd: number;
  tradeCount: number;
  winRate: number;
};

export type StrategySignal = {
  action: StrategyAction;
  confidence: number;
  liquidityUsd: number;
  momentumBps: number;
  priceUsd: number;
  rationale: string;
  volumeUsd: number;
};

export type TradingJournalProof = {
  action: StrategyAction;
  agentId: string;
  chain?: ProductChainId;
  chainId: number;
  chainName?: string;
  decisionHash: string;
  error?: string;
  evidenceUri: string;
  explorerUrl?: string;
  journalAddress?: string;
  pnlBps: number;
  recordId?: string;
  resultHash: string;
  status: "anchored" | "failed" | "pending" | "prepared";
  strategyStatus: StrategyRecordStatus;
  txHash?: string;
};

export type StrategyBacktestPayload = {
  bars: StrategyMarketBar[];
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  equityCurve: StrategyEquityPoint[];
  generatedAt: string;
  latestSignal: StrategySignal;
  market: string;
  metrics: StrategyMetrics;
  pairAddress: string;
  params: StrategyBacktestParams;
  proof?: TradingJournalProof;
  queryId: string;
  runId: string;
  sourceUrl: string;
  strategyId: string;
  title: string;
  trades: StrategyTrade[];
};

export type StrategyScanCandidate = {
  latestSignal: StrategySignal;
  latestTimestamp: string;
  market: string;
  metrics: StrategyMetrics;
  pairAddress: string;
  rank: number;
  rowCount: number;
  score: number;
  scoreReason: string;
  totalVolumeUsd: number;
};

export type StrategyScanPayload = {
  bestBacktest: StrategyBacktestPayload;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  candidates: StrategyScanCandidate[];
  generatedAt: string;
  queryId: string;
  scannedPairs: number;
  selectedPairAddress: string;
  sourceUrl: string;
};

export type StrategyPaperTradePayload = {
  action: StrategyAction;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  confidence: number;
  generatedAt: string;
  market: string;
  notionalUsd: number;
  pairAddress: string;
  proof: TradingJournalProof;
  rationale: string;
  referenceBacktestRunId: string;
  runId: string;
  strategyId: string;
};

export type StrategyRunRecord = {
  action: StrategyAction;
  agentId: string;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  createdAt: string;
  decisionHash: string;
  evidenceUri: string;
  explorerUrl?: string;
  market: string;
  pnlBps: number;
  recordId: string;
  recorder: string;
  resultHash: string;
  runId: string;
  status: StrategyRecordStatus;
  strategyId: string;
  txHash?: string;
};

export type StrategyRunsPayload = {
  chain?: ProductChainId;
  chainId: number;
  chainName?: string;
  configured: boolean;
  error?: string;
  journalAddress?: string;
  nextRecordId: string;
  records: StrategyRunRecord[];
};

export type StrategyBacktestResponse = {
  backtest: StrategyBacktestPayload;
  configured: true;
};

export type StrategyPaperTradeResponse = {
  configured: true;
  paperTrade: StrategyPaperTradePayload;
};

export type StrategyScanResponse = {
  configured: true;
  scan: StrategyScanPayload;
};

export type AlphaWatchlistItem = {
  addedAt: string;
  agentId?: string;
  caveat: string;
  chain: string;
  decisionHash?: string;
  decisionId?: string;
  evidenceUri?: string;
  explorerUrl?: string;
  gapCount: number;
  id: string;
  intent: string;
  proofTx?: string;
  recommendation: string;
  signalType: string;
  sourceCount: number;
  subject: string;
  summary: string;
  title: string;
};

export type AlphaWatchlistPayload = {
  cleared?: boolean;
  configured: true;
  deleted?: boolean;
  item?: AlphaWatchlistItem;
  itemId?: string;
  items?: AlphaWatchlistItem[];
};

export type RouterPricing = {
  prompt?: string;
  completion?: string;
  image?: string;
  [key: string]: string | undefined;
};

export type RouterModel = {
  id: string;
  name?: string;
  type?: string;
  context_length?: number;
  max_completion_tokens?: number;
  supported_parameters?: string[];
  supported_formats?: string[];
  pricing?: RouterPricing;
  pricing_usd?: RouterPricing;
  provider_count?: number;
  [key: string]: unknown;
};

type ChatSessionsResponse =
  | {
      configured: false;
      error?: string;
    }
  | {
      configured: true;
      error?: string;
      deleted?: boolean;
      session?: ChatSession | null;
      sessions?: ChatSession[];
    };

type ApiKeysResponse =
  | {
      configured: false;
      error?: string;
    }
  | {
      configured: true;
      error?: string;
      key?: ApiKeyRecord;
      keys?: ApiKeyRecord[];
      secret?: string;
    };

type AutomationResponse<T> = T & {
  code?: string;
  configured?: boolean;
  error?: string;
};

type MemoryResponse =
  | {
      configured: false;
      error?: string;
    }
  | {
      configured: true;
      deleted?: boolean;
      deletedIds?: string[];
      error?: string;
      memories?: MemoryItem[];
      memory?: MemoryItem;
      settings?: MemorySettings;
      stats?: MemoryStats;
    };

const DEFAULT_BACKEND_URL = "/api/backend";

export const CHAT_SESSIONS_UPDATED_EVENT = "langclaw-chat-sessions-updated";

export class LangclawApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.code = code;
    this.name = "LangclawApiError";
    this.status = status;
  }
}

export function getLangclawApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_LANGCLAW_API_URL?.replace(/\/+$/, "") ||
    DEFAULT_BACKEND_URL
  );
}

export function getLangclawApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getLangclawApiBaseUrl()}${normalizedPath}`;
}

export async function checkBackendHealth() {
  const response = await getRequest("/health");

  return readJsonResponse<{ ok: boolean; service: string }>(response);
}

export async function requestWalletChallenge(input: {
  address: string;
  chainId?: number;
  purpose?: WalletAuthPurpose;
}) {
  const response = await postJson("/api/wallet/challenge", input);
  const payload = await readJsonResponse<{
    challenge?: WalletChallenge;
    configured: true;
    error?: string;
  }>(response);

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  if (!payload.challenge) {
    throw new LangclawApiError("Wallet challenge was not returned.", 500);
  }

  return payload.challenge;
}

export async function createWalletSession(wallet: WalletAuth) {
  const response = await postJson("/api/wallet/session", { wallet });
  const payload = await readJsonResponse<{
    configured: true;
    error?: string;
    wallet?: WalletAuth;
  }>(response);

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  if (!payload.wallet?.sessionToken) {
    throw new LangclawApiError("Wallet session was not returned.", 500);
  }

  return payload.wallet;
}

export async function runDiscover(input: {
  topic: string;
  wallet?: WalletAuth;
  signal?: AbortSignal;
}) {
  const response = await postJson(
    "/api/discover",
    { topic: input.topic, wallet: input.wallet },
    input.signal,
  );

  return readJsonResponse<DiscoverPayload>(response);
}

export async function streamDiscover(input: DiscoverStreamInput) {
  const response = await postJson(
    "/api/discover/stream",
    { topic: input.topic, wallet: input.wallet },
    input.signal,
  );

  await readNdjson<DiscoverStreamChunk>(response, (chunk) => {
    if (chunk.type === "progress") {
      if (chunk.event) {
        input.onProgress?.(chunk.event);
      }
      return;
    }

    if (chunk.type === "result") {
      if (chunk.payload) {
        input.onResult?.(chunk.payload);
      }
      return;
    }

    if (chunk.type === "error") {
      input.onError?.(readErrorMessage(chunk.error));
    }
  });
}

export async function streamChat(input: ChatStreamInput) {
  const toolMode = input.toolMode ?? (input.researchTrend ? "research" : "chat");
  const response = await postJson(
    "/api/chat/stream",
    {
      message: input.message,
      chain: input.chain,
      messages: input.messages ?? [],
      model: input.model,
      researchTrend: toolMode === "research",
      sessionId: input.sessionId,
      toolMode,
      useAgent: toolMode === "research",
      wallet: input.wallet,
    },
    input.signal,
  );

  await readNdjson<ChatStreamChunk>(response, (chunk) => {
    if (chunk.type === "direct_delta") {
      input.onDirectDelta?.(typeof chunk.delta === "string" ? chunk.delta : "");
      return;
    }

    if (chunk.type === "direct_reasoning_delta") {
      input.onDirectReasoningDelta?.(
        typeof chunk.delta === "string" ? chunk.delta : "",
      );
      return;
    }

    if (chunk.type === "direct") {
      if (chunk.payload) {
        input.onDirect?.(chunk.payload);
      }
      return;
    }

    if (chunk.type === "mode") {
      input.onMode?.(typeof chunk.mode === "string" ? chunk.mode : "");
      return;
    }

    if (chunk.type === "tool_plan") {
      if (chunk.plan) {
        input.onToolPlan?.(chunk.plan);
      }
      return;
    }

    if (chunk.type === "tool_call") {
      if (chunk.event) {
        input.onToolCall?.(chunk.event);
      }
      return;
    }

    if (chunk.type === "tool_result") {
      if (chunk.event) {
        input.onToolResult?.(chunk.event);
      }
      return;
    }

    if (chunk.type === "tool_final") {
      if (chunk.payload) {
        input.onToolFinal?.(chunk.payload);
      }
      return;
    }

    if (chunk.type === "progress") {
      if (chunk.event) {
        input.onProgress?.(chunk.event);
      }
      return;
    }

    if (chunk.type === "result") {
      if (chunk.payload) {
        input.onResult?.(chunk.payload);
      }
      return;
    }

    if (chunk.type === "error") {
      input.onError?.(readErrorMessage(chunk.error));
    }
  });
}

export async function listChatSessions(wallet: WalletAuth) {
  const response = await chatSessionsRequest({ action: "list", wallet });

  return response.sessions ?? [];
}

export async function getChatSession(wallet: WalletAuth, sessionId: string) {
  const response = await chatSessionsRequest({
    action: "get",
    sessionId,
    wallet,
  });

  return response.session ?? null;
}

export async function upsertChatSession(
  wallet: WalletAuth,
  session: ChatSession,
) {
  const response = await chatSessionsRequest({
    action: "upsert",
    session,
    wallet,
  });

  return response.session ?? null;
}

export async function deleteChatSession(wallet: WalletAuth, sessionId: string) {
  const response = await chatSessionsRequest({
    action: "delete",
    sessionId,
    wallet,
  });

  return Boolean(response.deleted);
}

export async function updateChatSessionMetadata(
  wallet: WalletAuth,
  input: {
    pinned?: boolean;
    sessionId: string;
    title?: string;
  },
) {
  const response = await chatSessionsRequest({
    action: "update",
    pinned: input.pinned,
    sessionId: input.sessionId,
    title: input.title,
    wallet,
  });

  return response.session ?? null;
}

export async function listApiKeys(wallet: WalletAuth) {
  const response = await apiKeysRequest({ action: "list", wallet });

  return response.keys ?? [];
}

export async function createApiKey(wallet: WalletAuth, name: string) {
  const response = await apiKeysRequest({ action: "create", name, wallet });

  if (!response.key || !response.secret) {
    throw new LangclawApiError("API key was not returned.", 500);
  }

  return {
    configured: true,
    key: response.key,
    secret: response.secret,
  } satisfies ApiKeyCreatePayload;
}

export async function revokeApiKey(wallet: WalletAuth, keyId: string) {
  const response = await apiKeysRequest({ action: "revoke", keyId, wallet });

  if (!response.key) {
    throw new LangclawApiError("API key was not returned.", 500);
  }

  return response.key;
}

export async function getMemoryDashboard(wallet: WalletAuth) {
  const response = await memoryRequest({ action: "list", wallet });

  return {
    configured: true,
    memories: response.memories ?? [],
    settings: requireMemorySettings(response.settings),
    stats: response.stats ?? buildMemoryStats(response.memories ?? []),
  } satisfies MemoryDashboard;
}

export async function setMemoryStatus(
  wallet: WalletAuth,
  memoryId: string,
  status: MemoryStatus,
) {
  const response = await memoryRequest({
    action: "status",
    memoryId,
    status,
    wallet,
  });

  if (!response.memory) {
    throw new LangclawApiError("Memory was not returned.", 500);
  }

  return response.memory;
}

export async function setManyMemoryStatuses(
  wallet: WalletAuth,
  memoryIds: string[],
  status: MemoryStatus,
) {
  const response = await memoryRequest({
    action: "bulk-status",
    memoryIds,
    status,
    wallet,
  });

  return response.memories ?? [];
}

export async function deleteMemoryRecord(
  wallet: WalletAuth,
  memoryId: string,
) {
  const response = await memoryRequest({
    action: "delete",
    memoryId,
    wallet,
  });

  return response.deletedIds ?? (response.deleted ? [memoryId] : []);
}

export async function deleteManyMemoryRecords(
  wallet: WalletAuth,
  memoryIds: string[],
) {
  const response = await memoryRequest({
    action: "bulk-delete",
    memoryIds,
    wallet,
  });

  return response.deletedIds ?? [];
}

export async function getMemorySettings(wallet: WalletAuth) {
  const response = await memorySettingsRequest({ action: "get", wallet });

  return requireMemorySettings(response.settings);
}

export async function updateMemorySettings(
  wallet: WalletAuth,
  settings: MemorySettingsInput,
) {
  const response = await memorySettingsRequest({
    action: "update",
    settings,
    wallet,
  });

  return requireMemorySettings(response.settings);
}

export async function getAutomationDashboard(wallet: WalletAuth) {
  const response = await postJson("/api/automation/tasks", {
    action: "list",
    wallet,
  });

  return readAutomationResponse<AutomationDashboard>(response);
}

export async function createAutomationTask(
  wallet: WalletAuth,
  task: AutomationTaskInput,
) {
  const response = await postJson("/api/automation/tasks", {
    action: "create",
    task,
    wallet,
  });
  const payload = await readAutomationResponse<{ task: AutomationTask }>(
    response,
  );

  return payload.task;
}

export async function updateAutomationTask(
  wallet: WalletAuth,
  taskId: string,
  task: AutomationTaskInput,
) {
  const response = await postJson("/api/automation/tasks", {
    action: "update",
    task,
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ task: AutomationTask }>(
    response,
  );

  return payload.task;
}

export async function setAutomationTaskStatus(
  wallet: WalletAuth,
  taskId: string,
  status: Extract<AutomationTaskStatus, "active" | "paused">,
) {
  const response = await postJson("/api/automation/tasks", {
    action: status === "active" ? "resume" : "pause",
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ task: AutomationTask }>(
    response,
  );

  return payload.task;
}

export async function deleteAutomationTask(
  wallet: WalletAuth,
  taskId: string,
) {
  const response = await postJson("/api/automation/tasks", {
    action: "delete",
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ deleted?: boolean }>(response);

  return Boolean(payload.deleted);
}

export async function setAllAutomationTasksStatus(
  wallet: WalletAuth,
  status: Extract<AutomationTaskStatus, "active" | "paused">,
) {
  const response = await postJson("/api/automation/tasks", {
    action: status === "active" ? "resume-all" : "pause-all",
    wallet,
  });
  const payload = await readAutomationResponse<{ tasks: AutomationTask[] }>(
    response,
  );

  return payload.tasks ?? [];
}

export async function runAutomationTask(wallet: WalletAuth, taskId: string) {
  const response = await postJson("/api/automation/runs", {
    action: "run",
    taskId,
    triggeredBy: "manual",
    wallet,
  });
  const payload = await readAutomationResponse<{ run: AutomationRun }>(
    response,
  );

  return payload.run;
}

export async function listAutomationRuns(wallet: WalletAuth, taskId?: string) {
  const response = await postJson("/api/automation/runs", {
    action: "list",
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ runs: AutomationRun[] }>(
    response,
  );

  return payload.runs ?? [];
}

export async function getAutomationSettings(wallet: WalletAuth) {
  const response = await postJson("/api/automation/settings", {
    action: "get",
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return payload.settings;
}

export async function updateAutomationSettings(
  wallet: WalletAuth,
  settings: AutomationSettingsInput,
) {
  const response = await postJson("/api/automation/settings", {
    action: "update",
    settings,
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return payload.settings;
}

export async function listInAppAutomationNotifications(
  wallet: WalletAuth,
  limit = 20,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "list-in-app",
    limit,
    wallet,
  });
  const payload = await readAutomationResponse<{
    notifications: AutomationInAppNotification[];
  }>(response);

  return payload.notifications ?? [];
}

export async function markAutomationNotificationRead(
  wallet: WalletAuth,
  notificationId: string,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "mark-in-app-read",
    notificationId,
    wallet,
  });
  const payload = await readAutomationResponse<{
    notification: AutomationInAppNotification;
  }>(response);

  return payload.notification;
}

export async function markAllAutomationNotificationsRead(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "mark-all-in-app-read",
    wallet,
  });
  const payload = await readAutomationResponse<{ read?: boolean }>(response);

  return Boolean(payload.read);
}

export async function requestAutomationEmailLink(
  wallet: WalletAuth,
  email: string,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "request-email-link",
    email,
    wallet,
  });

  return readAutomationResponse<{
    link: { email: string; expiresAt: string; sent: boolean };
  }>(response);
}

export async function verifyAutomationEmailLink(
  wallet: WalletAuth,
  code: string,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "verify-email-link",
    code,
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return payload.settings;
}

export async function unlinkAutomationEmail(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "unlink-email",
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return payload.settings;
}

export async function createAutomationTelegramLink(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "create-telegram-link",
    wallet,
  });
  const payload = await readAutomationResponse<{
    link: {
      botUsername: string;
      code: string;
      command: string;
      deepLink: string;
      expiresAt: string;
    };
  }>(response);

  return payload.link;
}

export async function pollAutomationTelegramLink(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "poll-telegram-link",
    wallet,
  });

  return readAutomationResponse<{
    linked: boolean;
    settings?: AutomationSettings;
    status: string;
  }>(response);
}

export async function unlinkAutomationTelegram(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "unlink-telegram",
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return payload.settings;
}

export async function getUsageBalance(wallet: WalletAuth, chain?: ProductChainId) {
  const response = await postJson("/api/usage/balance", { chain, wallet });

  return readJsonResponse<UsageBalancePayload>(response);
}

export async function getUsageQuote(chain?: ProductChainId) {
  const response = await postJson("/api/usage/quote", { chain });

  return readJsonResponse<UsageQuotePayload>(response);
}

export async function getUsageVaultInfo(chain?: ProductChainId) {
  const response = await postJson("/api/usage/vault", { chain });

  return readJsonResponse<UsageVaultInfoPayload>(response);
}

export async function getUsageVaultAdminStatus(
  wallet: WalletAuth,
  chain?: ProductChainId,
) {
  const response = await postJson("/api/admin/usage-vault/status", {
    chain,
    wallet,
  });

  return readJsonResponse<UsageVaultAdminStatusPayload>(response);
}

export async function verifyUsageDeposit(input: {
  chain?: ProductChainId;
  reference?: string;
  txHash: string;
  wallet: WalletAuth;
}) {
  const response = await postJson("/api/usage/deposit/verify", input);

  return readJsonResponse<UsageDepositVerifyPayload>(response);
}

export async function verifyUsageVaultWithdrawal(input: {
  amountMist: string;
  chain?: ProductChainId;
  recipient: string;
  txHash: string;
  wallet: WalletAuth;
}) {
  const response = await postJson("/api/admin/usage-vault/withdrawals/verify", input);

  return readJsonResponse<UsageVaultWithdrawalVerifyPayload>(response);
}

export async function requestUsageWithdraw(
  wallet: WalletAuth,
  chain?: ProductChainId
) {
  const response = await postJson("/api/usage/withdraw/request", { chain, wallet });

  return readJsonResponse<UsageWithdrawRequestPayload>(response);
}

export async function listProofDecisions(limit = 20, chain?: ProductChainId) {
  const response = await postJson("/api/proofs/decisions", { chain, limit });

  return readJsonResponse<ProofDecisionsPayload>(response);
}

export async function runStrategyBacktest(input: {
  chain?: ProductChainId;
  pairAddress?: string;
  queryId?: string;
}) {
  const response = await postJson("/api/strategy/backtest", input);
  const payload = await readJsonResponse<StrategyBacktestResponse>(response);

  return payload.backtest;
}

export async function scanStrategyPairs(input: {
  chain?: ProductChainId;
  limit?: number;
  queryId?: string;
}) {
  const response = await postJson("/api/strategy/scan-pairs", input);
  const payload = await readJsonResponse<StrategyScanResponse>(response);

  return payload.scan;
}

export async function openStrategyPaperTrade(input: {
  chain?: ProductChainId;
  backtest: StrategyBacktestPayload;
  notionalUsd?: number;
}) {
  const response = await postJson("/api/strategy/paper-trade", input);
  const payload = await readJsonResponse<StrategyPaperTradeResponse>(response);

  return payload.paperTrade;
}

export async function listStrategyRuns(limit = 25, chain?: ProductChainId) {
  const response = await postJson("/api/strategy/runs", { chain, limit });

  return readJsonResponse<StrategyRunsPayload>(response);
}

export async function listAlphaWatchlist(wallet: WalletAuth) {
  const response = await postJson("/api/watchlist", {
    action: "list",
    wallet,
  });
  const payload = await readJsonResponse<AlphaWatchlistPayload>(response);

  return payload.items ?? [];
}

export async function upsertAlphaWatchlistItem(
  wallet: WalletAuth,
  item: AlphaWatchlistItem,
) {
  const response = await postJson("/api/watchlist", {
    action: "upsert",
    item,
    wallet,
  });
  const payload = await readJsonResponse<AlphaWatchlistPayload>(response);

  if (!payload.item) {
    throw new LangclawApiError("Watchlist item was not returned.", 500);
  }

  return payload.item;
}

export async function deleteAlphaWatchlistItem(
  wallet: WalletAuth,
  itemId: string,
) {
  const response = await postJson("/api/watchlist", {
    action: "delete",
    itemId,
    wallet,
  });
  const payload = await readJsonResponse<AlphaWatchlistPayload>(response);

  return Boolean(payload.deleted);
}

export async function clearAlphaWatchlist(wallet: WalletAuth) {
  const response = await postJson("/api/watchlist", {
    action: "clear",
    wallet,
  });
  const payload = await readJsonResponse<AlphaWatchlistPayload>(response);

  return Boolean(payload.cleared);
}

export function dispatchChatSessionsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CHAT_SESSIONS_UPDATED_EVENT));
}

async function chatSessionsRequest(body: {
  action: "delete" | "get" | "list" | "update" | "upsert";
  pinned?: boolean;
  wallet: WalletAuth;
  sessionId?: string;
  session?: ChatSession;
  title?: string;
}) {
  const response = await postJson("/api/chat/sessions", body);
  const payload = await readJsonResponse<ChatSessionsResponse>(response);

  if (!payload.configured) {
    throw new LangclawApiError(
      payload.error || "Chat session storage is not configured.",
      503,
    );
  }

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload;
}

async function apiKeysRequest(body: {
  action: "create" | "list" | "revoke";
  keyId?: string;
  name?: string;
  wallet: WalletAuth;
}) {
  const response = await postJson("/api/api-keys", body);
  const payload = await readJsonResponse<ApiKeysResponse>(response);

  if (!payload.configured) {
    throw new LangclawApiError(
      payload.error || "API keys are not configured.",
      503,
    );
  }

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload;
}

async function memoryRequest(body: {
  action: "bulk-delete" | "bulk-status" | "delete" | "list" | "status";
  memoryId?: string;
  memoryIds?: string[];
  status?: MemoryStatus;
  wallet: WalletAuth;
}) {
  const response = await postJson("/api/memory", body);
  const payload = await readJsonResponse<MemoryResponse>(response);

  if (!payload.configured) {
    throw new LangclawApiError(
      payload.error || "Memory storage is not configured.",
      503,
    );
  }

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload;
}

async function memorySettingsRequest(body: {
  action: "get" | "update";
  settings?: MemorySettingsInput;
  wallet: WalletAuth;
}) {
  const response = await postJson("/api/memory/settings", body);
  const payload = await readJsonResponse<MemoryResponse>(response);

  if (!payload.configured) {
    throw new LangclawApiError(
      payload.error || "Memory settings are not configured.",
      503,
    );
  }

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload;
}

async function readAutomationResponse<T>(response: Response) {
  const payload = await readJsonResponse<AutomationResponse<T>>(response);

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload as T;
}

function requireMemorySettings(settings?: MemorySettings) {
  if (!settings) {
    throw new LangclawApiError("Memory settings were not returned.", 500);
  }

  return settings;
}

function buildMemoryStats(memories: MemoryItem[]): MemoryStats {
  return {
    active: memories.filter((memory) => memory.status === "active").length,
    disabled: memories.filter((memory) => memory.status === "disabled").length,
    projectScoped: memories.filter((memory) => memory.scope !== "Global").length,
    total: memories.length,
  };
}

export function readFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const status = error instanceof LangclawApiError ? error.status : 0;

  const balanceMatch = message.match(/insufficient\s+([a-z0-9$.-]+)\s+balance/i);

  if (balanceMatch) {
    const symbol = balanceMatch[1].toUpperCase();
    return `Insufficient ${symbol} balance. Add ${symbol} before running this request.`;
  }

  if (status === 402) {
    return message || "Insufficient balance. Add funds before running this request.";
  }

  if (
    error instanceof LangclawApiError &&
    (error.code === "telegram_link_required" ||
      (status === 403 && /telegram connection is required/i.test(message)))
  ) {
    return "Connect Telegram to continue.";
  }

  if (/wallet signature or api key is required/i.test(message)) {
    return "Connect and approve your wallet to continue.";
  }

  if (/wallet signature is required/i.test(message)) {
    return "Approve the wallet prompt to continue.";
  }

  if (/supabase/i.test(message)) {
    return "Account storage is not ready yet. Check backend configuration.";
  }

  return message || fallback;
}

export function isWalletSignatureRequiredError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  return /wallet signature( or api key)? is required/i.test(message);
}

async function getRequest(
  path: string,
  headers?: Record<string, string>,
  signal?: AbortSignal,
) {
  return fetch(getLangclawApiUrl(path), {
    cache: "no-store",
    headers,
    signal,
  });
}

async function postJson(path: string, body: unknown, signal?: AbortSignal) {
  return fetch(getLangclawApiUrl(path), {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });
}

async function readJsonResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    code?: unknown;
    error?: unknown;
  } | null;

  if (!response.ok) {
    throw new LangclawApiError(
      normalizeError(payload?.error) ||
        `Request failed with status ${response.status}.`,
      response.status,
      typeof payload?.code === "string" ? payload.code : undefined,
    );
  }

  return payload as T;
}

async function readNdjson<TChunk>(
  response: Response,
  onChunk: (chunk: TChunk) => void,
) {
  if (!response.ok) {
    await readJsonResponse(response);
    return;
  }

  if (!response.body) {
    throw new LangclawApiError(
      "Streaming response was empty.",
      response.status,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      onChunk(JSON.parse(trimmed) as TChunk);
    }
  }

  const remaining = buffer.trim();

  if (remaining) {
    onChunk(JSON.parse(remaining) as TChunk);
  }
}

function readErrorMessage(value: unknown) {
  return normalizeError(value) || "Langclaw request failed.";
}

function normalizeError(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.message === "string") {
      return record.message;
    }

    if (typeof record.error === "string") {
      return record.error;
    }
  }

  return "";
}
