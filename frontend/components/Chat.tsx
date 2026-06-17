"use client";

import { useChat } from "@ai-sdk/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  BotIcon,
  BookmarkCheckIcon,
  BookmarkPlusIcon,
  CopyIcon,
  InfoIcon,
  KeyRoundIcon,
  MessageSquareIcon,
  RadioTowerIcon,
  RefreshCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";
import {
  Fragment,
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Confirmation,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import {
  Context,
  ContextContent,
  ContextContentBody,
  ContextContentHeader,
  ContextTrigger,
} from "@/components/ai-elements/context";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  type ToolPart,
} from "@/components/ai-elements/tool";
import {
  Transcription,
  TranscriptionSegment,
} from "@/components/ai-elements/transcription";
import {
  DiscoverDetails,
  isWorkflowStreaming,
  ResearchReportPanel,
  StatusPill,
  WorkflowPlan,
} from "@/components/LangclawResult";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  consumePendingPrompt,
  createChatSession,
  getUIMessageText,
  type LangclawUIMessage,
  markLatestAssistantStopped,
  storedMessagesToUIMessages,
  updateSessionMessages,
  uiMessagesToStoredMessages,
} from "@/lib/chat-utils";
import { createLangclawChatTransport } from "@/lib/langclaw-chat-transport";
import {
  LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
  buildAlphaWatchlistItem,
  dispatchAlphaWatchlistUpdated,
} from "@/lib/alpha-watchlist";
import type { Experimental_TranscriptionResult } from "ai";
import {
  listAlphaWatchlist,
  dispatchChatSessionsUpdated,
  type DefiRankingCoverage,
  type DefiRankingMetrics,
  getChatSession,
  isWalletSignatureRequiredError,
  readFriendlyError,
  type ChatMode,
  type DirectChatUsage,
  type ModelUsageReceipt,
  type OnChainToolFinalPayload,
  type OnChainToolResult,
  type ResearchReportEntity,
  type ChatSession,
  type StoredChatMessage,
  upsertAlphaWatchlistItem,
  upsertChatSession,
} from "@/lib/langclaw-api";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  DEFAULT_CHAT_MODEL_ID,
  FIXED_CHAT_MODEL_LABEL,
  resolveChatModel,
} from "@/lib/chat-model";
import {
  isTelegramLinkRequiredError,
  useTelegramConnectGate,
} from "@/components/TelegramConnectDialog";
import { cn } from "@/lib/utils";

type ChatProps = {
  sessionId?: string;
};

type SubmitOptions = {
  toolMode?: ChatMode;
};

type TranscriptionSegments = Experimental_TranscriptionResult["segments"];

const CHAT_SUGGESTIONS = [
  "Find smart-money accumulation on Sui",
  "Detect liquidity anomalies on Sui DEX pairs",
  "Rank Sui protocols by TVL and yield momentum",
];

const BACKEND_CONTEXT_WINDOW = 32_000;
const alphaChartConfig = {
  amount: {
    color: "var(--chart-2)",
    label: "Amount",
  },
  confidence: {
    color: "var(--chart-2)",
    label: "Confidence",
  },
  count: {
    color: "var(--chart-2)",
    label: "Tools",
  },
  score: {
    color: "var(--chart-2)",
    label: "Score",
  },
  value: {
    color: "var(--chart-2)",
    label: "Value",
  },
} satisfies ChartConfig;

const Chat = ({ sessionId }: ChatProps) => {
  const { clearWalletAuth, getWalletAuth, isConnected, isSigning, openWalletModal } =
    useWalletSession();
  const {
    dialog: telegramDialog,
    openTelegramDialog,
    requireTelegramLinkedWallet,
  } = useTelegramConnectGate();
  const transport = useMemo(() => createLangclawChatTransport(), []);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState("");
  const [toolMode, setToolMode] = useState<ChatMode>("chat");
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [speechSegments, setSpeechSegments] = useState<TranscriptionSegments>(
    [],
  );
  const [pendingRetryMessageId, setPendingRetryMessageId] = useState<
    string | null
  >(null);
  const sessionRef = useRef<ChatSession | null>(null);
  const pendingStartedRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const persistSession = useCallback(
    async (nextSession: ChatSession) => {
      if (!isConnected) {
        openWalletModal();
        const message = "Choose a wallet to save this chat.";
        setSaveError(message);
        toast.error(message);
        return;
      }

      const wallet = await getWalletAuth();
      await upsertChatSession(wallet, nextSession);
      dispatchChatSessionsUpdated();
      setSaveError("");
    },
    [getWalletAuth, isConnected, openWalletModal],
  );

  const {
    error: chatError,
    messages,
    regenerate,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat<LangclawUIMessage>({
    id: sessionId,
    onError: (err) => {
      if (isTelegramLinkRequiredError(err)) {
        openTelegramDialog();
      }

      setError(err.message);
      toast.error(err.message);
    },
    onFinish: ({ isAbort, messages: finishedMessages }) => {
      const finalMessages = isAbort
        ? markLatestAssistantStopped(finishedMessages)
        : finishedMessages;
      const storedMessages = uiMessagesToStoredMessages(finalMessages);
      const firstMessage = storedMessages[0]?.content || "New Chat";
      const baseSession =
        sessionRef.current ?? createChatSession(firstMessage, sessionId);
      const nextSession = updateSessionMessages(baseSession, storedMessages);

      sessionRef.current = nextSession;
      setSession(nextSession);

      void persistSession(nextSession).catch((saveErr) => {
        const message =
          saveErr instanceof Error ? saveErr.message : "Unable to save chat.";
        setSaveError(message);
        toast.error(message);
      });
    },
    transport,
  });

  const storedMessages = useMemo(
    () => uiMessagesToStoredMessages(messages),
    [messages],
  );
  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (
          message,
        ): message is LangclawUIMessage & { role: "assistant" | "user" } =>
          message.role === "assistant" || message.role === "user",
      ),
    [messages],
  );
  const estimatedContextTokens = useMemo(
    () =>
      estimateTokens(
        [input, ...storedMessages.map((message) => message.content)].join("\n"),
      ),
    [input, storedMessages],
  );
  const maxContextTokens = BACKEND_CONTEXT_WINDOW;

  const submitMessage = useCallback(
    async (text: string, options: SubmitOptions = {}) => {
      const content = text.trim();

      if (!content || status === "submitted" || status === "streaming") {
        return;
      }

      if (!isConnected) {
        openWalletModal();
        showError(
          setError,
          "Choose a wallet to send your message.",
        );
        return;
      }

      const selectedToolMode = options.toolMode ?? toolMode;
      const baseSession =
        sessionRef.current ??
        createChatSession(content, sessionId ?? undefined);

      setError("");
      setSaveError("");
      setSpeechSegments([]);
      sessionRef.current = baseSession;
      setSession(baseSession);

      const sendWithWallet = async (forceWalletSignature = false) => {
        const wallet = await requireTelegramLinkedWallet({
          force: forceWalletSignature,
        });

        await sendMessage(
          { text: content },
          {
            body: {
              model: resolveChatModel(),
              researchTrend: selectedToolMode === "research",
              sessionId: baseSession.id,
              toolMode: selectedToolMode,
              wallet,
            },
          },
        );
      };

      try {
        await sendWithWallet();
      } catch (err) {
        if (isWalletSignatureRequiredError(err)) {
          try {
            clearWalletAuth();
            await sendWithWallet(true);
            toast.success("Wallet signature refreshed", {
              description: "Sending your message now.",
            });
            return;
          } catch (retryErr) {
            showError(
              setError,
              readFriendlyError(retryErr, "Unable to start the chat."),
            );
            return;
          }
        }

        if (isTelegramLinkRequiredError(err)) {
          return;
        }

        showError(
          setError,
          readFriendlyError(err, "Unable to start the chat."),
        );
      }
    },
    [
      clearWalletAuth,
      isConnected,
      openWalletModal,
      requireTelegramLinkedWallet,
      sendMessage,
      sessionId,
      status,
      toolMode,
    ],
  );

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let active = true;

    const loadSession = async () => {
      if (!isConnected) {
        openWalletModal();
        showError(setError, "Choose a wallet to load saved chats.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const wallet = await getWalletAuth();
        const loadedSession = await getChatSession(wallet, sessionId);
        const nextSession =
          loadedSession ?? createChatSession("New Chat", sessionId);

        if (!active) {
          return;
        }

        sessionRef.current = nextSession;
        setSession(nextSession);
        setMessages(storedMessagesToUIMessages(nextSession.messages));
      } catch (err) {
        if (!active) {
          return;
        }

        showError(
          setError,
          readFriendlyError(err, "Unable to load chat session."),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, [getWalletAuth, isConnected, openWalletModal, sessionId, setMessages]);

  useEffect(() => {
    if (!sessionId || loading || pendingStartedRef.current) {
      return;
    }

    const pending = consumePendingPrompt(sessionId);

    if (!pending) {
      return;
    }

    pendingStartedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      void submitMessage(pending.text, {
        toolMode: pending.toolMode ?? (pending.researchTrend ? "research" : "chat"),
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loading, sessionId, submitMessage]);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();

      if (message.files?.length) {
        showError(
          setError,
          "File attachments are not supported by the current chat backend.",
        );
        return;
      }

      if (!text) {
        return;
      }

      if (!isConnected) {
        openWalletModal();
        showError(setError, "Choose a wallet to send your message.");
        return;
      }

      setInput("");
      setSpeechSegments([]);
      await submitMessage(text);
    },
    [isConnected, openWalletModal, submitMessage],
  );

  const handleSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  const handleSpeechTranscript = useCallback((text: string) => {
    setInput((currentInput) => appendSpeechText(currentInput, text));
    setSpeechSegments((segments) => appendTranscriptionSegment(segments, text));
  }, []);

  const handleStop = useCallback(() => {
    stop();
    setMessages((currentMessages) =>
      markLatestAssistantStopped(currentMessages),
    );
    toast.info("Generation stopped");
  }, [setMessages, stop]);

  const handleRetry = useCallback(
    async (messageId: string) => {
      if (!isConnected) {
        openWalletModal();
        showError(
          setError,
          "Choose a wallet to retry this response.",
        );
        return;
      }

      const retryWithWallet = async (forceWalletSignature = false) => {
        const wallet = await requireTelegramLinkedWallet({
          force: forceWalletSignature,
        });
        const originalMessage = uiMessagesToStoredMessages(messages).find(
          (message) => message.id === messageId,
        );
        const retryMode =
          originalMessage?.mode === "onchain"
            ? "research"
            : (originalMessage?.mode ?? toolMode);

        await regenerate({
          body: {
            model: resolveChatModel(originalMessage?.model),
            researchTrend: retryMode === "research",
            sessionId: sessionRef.current?.id ?? sessionId,
            toolMode: retryMode,
            wallet,
          },
          messageId,
        });

        return { retryMode };
      };

      try {
        setError("");
        setSaveError("");
        setPendingRetryMessageId(null);
        const { retryMode } = await retryWithWallet();
        toast.info("Retry started", {
          description:
            retryMode === "research"
              ? "Research mode"
                : FIXED_CHAT_MODEL_LABEL,
        });
      } catch (err) {
        if (isWalletSignatureRequiredError(err)) {
          try {
            clearWalletAuth();
            const { retryMode } = await retryWithWallet(true);
            toast.success("Wallet signature refreshed", {
              description:
                retryMode === "research"
                  ? "Retrying Research mode."
                    : `Retrying ${FIXED_CHAT_MODEL_LABEL}.`,
            });
            return;
          } catch (retryErr) {
            showError(
              setError,
              readFriendlyError(retryErr, "Unable to retry chat."),
            );
            return;
          }
        }

        if (isTelegramLinkRequiredError(err)) {
          return;
        }

        showError(
          setError,
          readFriendlyError(err, "Unable to retry chat."),
        );
      }
    },
    [
      clearWalletAuth,
      isConnected,
      openWalletModal,
      messages,
      regenerate,
      requireTelegramLinkedWallet,
      sessionId,
      toolMode,
    ],
  );

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
      <ChatWorkspaceHeader
        isConnected={isConnected}
        status={status}
        toolMode={toolMode}
      />
      <div className="flex min-h-0 flex-1 flex-col bg-muted/20">
        <Conversation className="min-h-0">
          <ConversationContent className="pb-4">
            {loading ? (
              <LoadingMessages />
            ) : visibleMessages.length === 0 ? (
              <ConversationEmptyState>
                <SearchIcon className="size-5 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">
                    Ask Langclaw for Sui intelligence
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {isConnected
                      ? "Ask directly or run Research for source-backed evidence and on-chain checks."
                      : "Connect wallet from the sidebar to chat and load saved sessions."}
                  </p>
                </div>
                <Suggestions className="justify-start sm:justify-center">
                  {CHAT_SUGGESTIONS.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      onClick={handleSuggestion}
                      suggestion={suggestion}
                    />
                  ))}
                </Suggestions>
              </ConversationEmptyState>
            ) : (
              visibleMessages.map((message) => {
                const content = getUIMessageText(message);
                const reasoningText = getVisibleReasoningText(message);
                const storedMessage = uiMessagesToStoredMessages([message])[0];
                const isAssistantStreaming =
                  message.role === "assistant" &&
                  (status === "submitted" || status === "streaming") &&
                  getLatestAssistantMessageId(visibleMessages) === message.id;
                const isWaitingForFirstUpdate =
                  isAssistantStreaming && !content && !reasoningText;

                return (
                  <Fragment key={message.id}>
                    <Message from={message.role}>
                      <MessageContent>
                        {reasoningText && (
                          <StreamingReasoning
                            isStreaming={isAssistantStreaming}
                            text={reasoningText}
                          />
                        )}
                        {isWaitingForFirstUpdate && <PendingReasoning />}
                        {content && (
                          <MessageResponse>{content}</MessageResponse>
                        )}
                        {storedMessage && (
                          <MessageTokenUsage message={storedMessage} />
                        )}
                        {storedMessage && (
                          <MessageDetails
                            message={storedMessage}
                            showReasoning={!reasoningText}
                          />
                        )}
                      </MessageContent>
                    </Message>
                    {message.role === "assistant" && content && (
                      <MessageActions>
                        <MessageAction
                          disabled={
                            status === "submitted" || status === "streaming"
                          }
                          label="Retry"
                          onClick={() => setPendingRetryMessageId(message.id)}
                          tooltip="Retry response"
                        >
                          <RefreshCcwIcon className="size-3" />
                        </MessageAction>
                        <MessageAction
                          label="Copy"
                          onClick={() => navigator.clipboard.writeText(content)}
                          tooltip="Copy response"
                        >
                          <CopyIcon className="size-3" />
                        </MessageAction>
                      </MessageActions>
                    )}
                    {pendingRetryMessageId === message.id && (
                      <Confirmation
                        approval={{ id: message.id }}
                        className="ml-0 max-w-2xl"
                        state="approval-requested"
                      >
                        <ConfirmationRequest>
                          <ConfirmationTitle>
                            Run this assistant response again with the current
                            backend route and Sui mode?
                          </ConfirmationTitle>
                          <ConfirmationActions>
                            <ConfirmationAction
                              onClick={() => setPendingRetryMessageId(null)}
                              variant="outline"
                            >
                              Cancel
                            </ConfirmationAction>
                            <ConfirmationAction
                              onClick={() => void handleRetry(message.id)}
                            >
                              Retry
                            </ConfirmationAction>
                          </ConfirmationActions>
                        </ConfirmationRequest>
                      </Confirmation>
                    )}
                  </Fragment>
                );
              })
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {(error || saveError || chatError) && (
          <div className="mx-3 mt-3 shrink-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error || saveError || chatError?.message}
          </div>
        )}

        <PromptInput
          className="sticky bottom-0 z-20 mx-auto mt-3 w-full shrink-0 rounded-none border-x-0 border-b-0 bg-background p-3"
          onSubmit={handleSubmit}
        >
          <SpeechTranscriptionPreview segments={speechSegments} />
          <PromptInputBody>
            <PromptInputTextarea
              className="min-h-20 pr-12"
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder="Ask about smart-money flow, liquidity anomalies, or protocol momentum..."
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter className="flex-wrap items-end gap-2">
            <PromptInputTools className="flex-1 flex-wrap gap-1.5">
              <SpeechInput
                aria-label="Dictate prompt"
                lang="en-US"
                onTranscriptionChange={handleSpeechTranscript}
                size="icon-sm"
                variant="ghost"
              />
              <ChatModeControl onChange={setToolMode} value={toolMode} />
              <Context
                maxTokens={maxContextTokens}
                modelId={DEFAULT_CHAT_MODEL_ID}
                usedTokens={estimatedContextTokens}
              >
                <ContextTrigger />
                <ContextContent>
                  <ContextContentHeader />
                  <ContextContentBody className="space-y-1 text-xs text-muted-foreground">
                    <p>Estimated from this conversation.</p>
                    <p>Final usage appears after the answer finishes.</p>
                  </ContextContentBody>
                </ContextContent>
              </Context>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={
                isSigning ||
                !isConnected ||
                (!input.trim() &&
                  status !== "submitted" &&
                  status !== "streaming")
              }
              onStop={handleStop}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
      {telegramDialog}
    </div>
  );
};

function ChatWorkspaceHeader({
  isConnected,
  status,
  toolMode,
}: {
  isConnected: boolean;
  status: string;
  toolMode: ChatMode;
}) {
  const isWorking = status === "submitted" || status === "streaming";
  const items = [
    {
      icon: RadioTowerIcon,
      label: "Sui mainnet",
    },
    {
      icon: BotIcon,
      label: FIXED_CHAT_MODEL_LABEL,
    },
    {
      icon: KeyRoundIcon,
      label: isConnected ? "Wallet connected" : "Wallet required",
    },
    {
      icon: ShieldCheckIcon,
      label: toolMode === "research" ? "Research mode" : "Chat mode",
    },
  ];

  return (
    <header className="shrink-0 border-b bg-background py-3 pr-4 pl-14 md:px-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-base tracking-normal">
              Langclaw workspace
            </h2>
            <Badge variant={isWorking ? "default" : "outline"}>
              {isWorking ? "Working" : "Ready"}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            Direct chat and evidence-backed research for Sui decisions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <span
                className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1 text-muted-foreground text-xs"
                key={item.label}
              >
                <Icon aria-hidden="true" className="size-3.5 text-primary" />
                {item.label}
              </span>
            );
          })}
        </div>
      </div>
    </header>
  );
}

function showError(setError: (message: string) => void, message: string) {
  setError(message);
  toast.error(message);
}

function PendingReasoning() {
  return (
    <Reasoning defaultOpen isStreaming>
      <ReasoningTrigger
        getThinkingMessage={() => "Starting live reasoning trace..."}
      />
      <ReasoningContent>
        {"Preparing request.\nWaiting for the first backend stream event."}
      </ReasoningContent>
    </Reasoning>
  );
}

function StreamingReasoning({
  isStreaming,
  text,
}: {
  isStreaming: boolean;
  text: string;
}) {
  return (
    <Reasoning defaultOpen isStreaming={isStreaming}>
      <ReasoningTrigger
        getThinkingMessage={(isThinking, duration) =>
          isThinking
            ? "Thinking through the request..."
            : `Thinking${duration ? ` (${duration}s)` : ""}`
        }
      />
      <ReasoningContent>{text}</ReasoningContent>
    </Reasoning>
  );
}

function ChatModeControl({
  onChange,
  value,
}: {
  onChange: (value: ChatMode) => void;
  value: ChatMode;
}) {
  const modes: Array<{
    icon: ComponentType<{ className?: string; size?: number }>;
    label: string;
    tooltip: string;
    value: ChatMode;
  }> = [
      {
        icon: MessageSquareIcon,
        label: "Chat",
        tooltip: "Chat directly with Langclaw.",
        value: "chat",
      },
      {
        icon: SearchIcon,
        label: "Research",
        tooltip:
          "Evidence-backed research that can enrich itself with on-chain checks when needed.",
        value: "research",
      },
    ];

  return (
    <ButtonGroup className="max-w-full shrink-0">
      {modes.map((mode) => {
        const Icon = mode.icon;

        return (
          <PromptInputButton
            aria-pressed={value === mode.value}
            key={mode.value}
            onClick={() => onChange(mode.value)}
            tooltip={mode.tooltip}
            type="button"
            variant={value === mode.value ? "default" : "ghost"}
          >
            <Icon className="size-4" />
            <span>{mode.label}</span>
          </PromptInputButton>
        );
      })}
    </ButtonGroup>
  );
}

function MessageTokenUsage({ message }: { message: StoredChatMessage }) {
  const usage = getMessageTokenUsage(message);
  const routerUsage = getRouterUsage(message);
  const costNeuron = routerUsage ? getRouterUsageCostNeuron(routerUsage) : undefined;

  if (!usage) {
    return null;
  }

  const inputLabel = usage.source === "estimated" ? "Input est." : "Input";
  const outputLabel = usage.source === "estimated" ? "Output est." : "Output";

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 text-xs text-muted-foreground",
        message.role === "assistant" ? "mt-3" : "mt-2"
      )}
    >
      {typeof usage.inputTokens === "number" && (
        <StatusPill
          label={inputLabel}
          value={`${formatNumber(usage.inputTokens)} tokens`}
        />
      )}
      {typeof usage.outputTokens === "number" && (
        <StatusPill
          label={outputLabel}
          value={`${formatNumber(usage.outputTokens)} tokens`}
        />
      )}
      {usage.source === "actual" && typeof usage.totalTokens === "number" && (
        <StatusPill
          label="Total"
          value={`${formatNumber(usage.totalTokens)} tokens`}
        />
      )}
      {costNeuron && (
        <StatusPill label="Cost" value={`${formatNeuron(costNeuron)} SUI`} />
      )}
      {routerUsage && <RouterUsageTooltip usage={routerUsage} />}
    </div>
  );
}

function MessageDetails({
  message,
  showReasoning = true,
}: {
  message: StoredChatMessage;
  showReasoning?: boolean;
}) {
  const reasoningText = buildReasoningText(message);
  const workflowEvents = message.progressEvents ?? [];

  if (
    !message.result &&
    !message.directAnswer &&
    !message.onChain &&
    !workflowEvents.length &&
    !message.error &&
    !message.stopped
  ) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3 text-xs text-muted-foreground">
      {message.directAnswer && (
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Mode" value="Direct chat" />
          {message.directAnswer.requestedModel && (
            <StatusPill
              label="Requested"
              value={message.directAnswer.requestedModel}
            />
          )}
          {message.directAnswer.usedModel && (
            <StatusPill label="Used" value={message.directAnswer.usedModel} />
          )}
          {message.directAnswer.model && (
            <StatusPill label="Model" value={message.directAnswer.model} />
          )}
          {message.directAnswer.modelHonored === false && (
            <StatusPill
              label="Fallback"
              value={message.directAnswer.fallbackFrom ?? "model fallback"}
            />
          )}
          {message.directAnswer.teeVerification?.status && (
            <StatusPill
              label="TEE"
              value={message.directAnswer.teeVerification.status}
            />
          )}
          {message.directAnswer.source && (
            <StatusPill label="Source" value={message.directAnswer.source} />
          )}
        </div>
      )}

      {showReasoning && reasoningText && (
        <Reasoning isStreaming={isWorkflowStreaming(workflowEvents)}>
          <ReasoningTrigger
            getThinkingMessage={(isStreaming, duration) =>
              isStreaming
                ? "Langclaw is reasoning through live evidence..."
                : `Langclaw reasoning${duration ? ` (${duration}s)` : ""}`
            }
          />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      )}

      {workflowEvents.length ? <WorkflowPlan events={workflowEvents} /> : null}

      {message.result && <DiscoverDetails payload={message.result} />}

      {message.onChain && !message.result && <OnChainDetails payload={message.onChain} />}

      {(message.error || message.directAnswer?.error) && (
        <p className="text-destructive">
          {message.error || message.directAnswer?.error}
        </p>
      )}
      {message.stopped && <p>Generation stopped.</p>}
    </div>
  );
}

function RouterUsageTooltip({
  usage,
}: {
  usage: DirectChatUsage | ModelUsageReceipt;
}) {
  const costNeuron = getRouterUsageCostNeuron(usage);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs"
            type="button"
          >
            <InfoIcon className="size-3" />
            <span>Model usage</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-72 flex-col items-start gap-1.5">
          <p className="font-medium">Model usage</p>
          <p>Model: {usage.model}</p>
          <p>
            Input tokens:{" "}
            {formatNumber(usage.inputTokens ?? usage.promptTokens)}
          </p>
          <p>
            Output tokens:{" "}
            {formatNumber(usage.outputTokens ?? usage.completionTokens)}
          </p>
          <p>Total tokens: {formatNumber(usage.totalTokens)}</p>
          {"provider" in usage && usage.provider && (
            <p>Provider: {usage.provider}</p>
          )}
          {"requestId" in usage && usage.requestId && (
            <p>Request: {usage.requestId}</p>
          )}
          {"status" in usage && usage.status && <p>Status: {usage.status}</p>}
          {"costSource" in usage && usage.costSource && (
            <p>Cost source: {usage.costSource}</p>
          )}
          {costNeuron && (
            <p>Cost: {formatNeuron(costNeuron)} SUI</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function OnChainDetails({ payload }: { payload: OnChainToolFinalPayload }) {
  const {
    clearWalletAuth,
    getWalletAuth,
    hasCachedWalletAuth,
    isConnected,
    openWalletModal,
  } = useWalletSession();
  const watchlistItem = useMemo(() => buildAlphaWatchlistItem(payload), [payload]);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);

  useEffect(() => {
    let active = true;

    const syncWatchlistState = async () => {
      if (!isConnected || !hasCachedWalletAuth) {
        setIsWatchlisted(false);
        return;
      }

      try {
        const wallet = await getWalletAuth();
        const items = await listAlphaWatchlist(wallet);

        if (active) {
          setIsWatchlisted(
            items.some((item) => item.id === watchlistItem.id)
          );
        }
      } catch {
        if (active) {
          setIsWatchlisted(false);
        }
      }
    };

    void syncWatchlistState();
    window.addEventListener(
      LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
      syncWatchlistState,
    );

    return () => {
      active = false;
      window.removeEventListener(
        LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT,
        syncWatchlistState,
      );
    };
  }, [getWalletAuth, hasCachedWalletAuth, isConnected, watchlistItem.id]);

  const handleAddToWatchlist = async () => {
    if (isWatchlisted) {
      return;
    }

    if (!isConnected) {
      openWalletModal();
      toast.error("Connect your wallet to save the watchlist.");
      return;
    }

    setIsSavingWatchlist(true);

    try {
      const wallet = await getWalletAuth();
      await upsertAlphaWatchlistItem(wallet, watchlistItem);
      setIsWatchlisted(true);
      dispatchAlphaWatchlistUpdated();
      toast.success("Watchlist added", {
        description: payload.title,
      });
    } catch (error) {
      if (isWalletSignatureRequiredError(error)) {
        clearWalletAuth();
      }

      toast.error(readFriendlyError(error, "Unable to save watchlist item."));
    } finally {
      setIsSavingWatchlist(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border bg-background/70 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Mode" value="Sui Intelligence" />
          <StatusPill label="Track" value="AI Alpha" />
          <StatusPill label="Evidence" value="Evidence-backed" />
          <StatusPill label="Intent" value={payload.plan.intent} />
          <StatusPill label="Chain" value={payload.plan.chain} />
          <StatusPill label="Tools" value={String(payload.tools.length)} />
          {payload.proof?.chain.status && (
            <StatusPill
              label="Agent decision proof"
              value={payload.proof.chain.status}
            />
          )}
        </div>
        <Button
          className="self-start"
          disabled={isWatchlisted || isSavingWatchlist}
          onClick={() => void handleAddToWatchlist()}
          size="sm"
          type="button"
          variant={isWatchlisted ? "secondary" : "outline"}
        >
          {isWatchlisted ? (
            <BookmarkCheckIcon className="size-4" />
          ) : (
            <BookmarkPlusIcon className="size-4" />
          )}
          {isWatchlisted
            ? "Watchlist added"
            : isSavingWatchlist
              ? "Saving..."
              : "Add to watchlist"}
        </Button>
      </div>
      {payload.report ? <ResearchReportPanel report={payload.report} /> : null}
      {payload.proof && <OnChainProofDetails proof={payload.proof} />}
      <OnChainAlphaVisualSummary payload={payload} />
      <div className="space-y-2">
        <p className="font-medium text-foreground">Tool results</p>
        {payload.tools.map((tool) => (
          <Tool
            className="mb-0 bg-background"
            defaultOpen
            key={`${tool.commandId}-${tool.provider}`}
          >
            <ToolHeader
              state={getOnChainToolState(tool.status)}
              title={tool.title}
              toolName={tool.commandId}
              type="dynamic-tool"
            />
            <ToolContent className="flex flex-col gap-2 pt-0 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label="Provider" value={tool.provider} />
                <StatusPill label="Status" value={tool.status} />
                <span>{tool.latencyMs}ms</span>
              </div>
              <p>{tool.summary}</p>
              {tool.sourceUrl && (
                <a
                  className="break-all text-foreground underline underline-offset-2"
                  href={tool.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {tool.sourceUrl}
                </a>
              )}
              {tool.error && <p className="text-destructive">{tool.error}</p>}
              <OnChainToolDataPreview tool={tool} />
            </ToolContent>
          </Tool>
        ))}
      </div>
    </div>
  );
}

function OnChainProofDetails({
  proof,
}: {
  proof: NonNullable<OnChainToolFinalPayload["proof"]>;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div className="rounded-md border bg-background p-2">
        <p className="font-medium text-foreground">Evidence bundle</p>
        <p className="mt-1 break-all text-sm text-muted-foreground">
          {proof.storage.evidenceUri}
        </p>
      </div>
      <a
        className="rounded-md border bg-background p-2"
        href={proof.chain.explorerUrl}
        rel="noreferrer"
        target="_blank"
      >
        <p className="font-medium text-foreground">Decision proof</p>
        <p className="mt-1 break-all text-sm text-muted-foreground">
          {proof.chain.txHash ||
            proof.chain.decisionHash ||
            proof.chain.briefHash}
        </p>
      </a>
    </div>
  );
}

function OnChainAlphaVisualSummary({
  payload,
}: {
  payload: OnChainToolFinalPayload;
}) {
  const summary = useMemo(() => buildOnChainVisualSummary(payload), [payload]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-foreground">Visual summary</p>
        <StatusPill
          label="Confidence"
          value={`${summary.confidenceLabel} ${summary.confidenceScore}%`}
        />
        <StatusPill label="Source gaps" value={String(summary.failedTools)} />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <AlphaVisualCard
          footer={`${summary.successTools} usable / ${summary.totalTools} total`}
          title="Source quality"
        >
          <ChartContainer
            className="h-32 w-full"
            config={alphaChartConfig}
            initialDimension={{ height: 128, width: 220 }}
          >
            <BarChart accessibilityLayer data={summary.sourceQualityData}>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                tickLine={false}
                tickMargin={6}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {summary.sourceQualityData.map((entry) => (
                  <Cell fill={entry.fill} key={entry.label} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </AlphaVisualCard>

        <AlphaVisualCard
          footer={
            summary.whaleTopLabel
              ? `Largest ${summary.whaleTopLabel}`
              : "No transfer value"
          }
          title="Whale transfers"
        >
          {summary.whaleBars.length ? (
            <ChartContainer
              className="h-32 w-full"
              config={alphaChartConfig}
              initialDimension={{ height: 128, width: 220 }}
            >
              <BarChart accessibilityLayer data={summary.whaleBars}>
                <CartesianGrid vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  tickLine={false}
                  tickMargin={6}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar
                  dataKey="amount"
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyVisualState text="Run a holder-flow prompt to chart transfer sizes." />
          )}
        </AlphaVisualCard>

        <AlphaVisualCard
          footer={
            summary.marketTopLabel
              ? `Top ${summary.marketTopLabel}`
              : "No market datapoint"
          }
          title="Liquidity snapshot"
        >
          {summary.marketBars.length ? (
            <ChartContainer
              className="h-32 w-full"
              config={alphaChartConfig}
              initialDimension={{ height: 128, width: 220 }}
            >
              <BarChart accessibilityLayer data={summary.marketBars}>
                <CartesianGrid vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  tickLine={false}
                  tickMargin={6}
                />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCompactCurrencyValue(value)}
                      hideLabel
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  fill="var(--chart-3)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyVisualState text="Run a liquidity or market prompt to chart pool data." />
          )}
        </AlphaVisualCard>

        <AlphaVisualCard
          footer={
            summary.yieldTopLabel
              ? `Top ${summary.yieldTopLabel}`
              : "No TVL or yield ranking"
          }
          title="TVL / yield ranking"
        >
          {summary.yieldBars.length ? (
            <ChartContainer
              className="h-32 w-full"
              config={alphaChartConfig}
              initialDimension={{ height: 128, width: 260 }}
            >
              <BarChart
                accessibilityLayer
                data={summary.yieldBars}
                layout="vertical"
              >
                <CartesianGrid horizontal={false} />
                <XAxis hide type="number" />
                <YAxis
                  axisLine={false}
                  dataKey="label"
                  tickLine={false}
                  type="category"
                  width={74}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCompactCurrencyValue(value)}
                      hideLabel
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  fill="var(--chart-4)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyVisualState text="Run a TVL or yield prompt to chart protocol ranking." />
          )}
        </AlphaVisualCard>

        <AlphaVisualCard
          footer={`${summary.confidenceLabel} confidence from ${summary.totalTools} tool checks`}
          title="Confidence / risk"
        >
          <div className="relative">
            <ChartContainer
              className="h-32 w-full"
              config={alphaChartConfig}
              initialDimension={{ height: 128, width: 220 }}
            >
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={summary.confidenceData}
                  dataKey="value"
                  innerRadius={34}
                  nameKey="label"
                  outerRadius={52}
                  strokeWidth={2}
                >
                  {summary.confidenceData.map((entry) => (
                    <Cell fill={entry.fill} key={entry.label} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="font-semibold text-foreground text-sm">
                {summary.confidenceScore}%
              </span>
            </div>
          </div>
        </AlphaVisualCard>
      </div>
    </div>
  );
}

function AlphaVisualCard({
  children,
  footer,
  title,
}: {
  children: ReactNode;
  footer: string;
  title: string;
}) {
  return (
    <div className="flex min-h-52 flex-col gap-2 rounded-md border bg-background p-2">
      <p className="font-medium text-foreground text-sm">{title}</p>
      <div className="min-h-32 flex-1">{children}</div>
      <p className="line-clamp-2 min-h-8 text-muted-foreground text-xs">
        {footer}
      </p>
    </div>
  );
}

function EmptyVisualState({ text }: { text: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-md bg-muted/30 px-3 text-center text-muted-foreground text-xs">
      {text}
    </div>
  );
}

function buildOnChainVisualSummary(payload: OnChainToolFinalPayload) {
  const successTools = payload.tools.filter(
    (tool) => tool.status === "success"
  ).length;
  const failedTools = payload.tools.filter(
    (tool) => tool.status === "failed"
  ).length;
  const skippedTools = payload.tools.filter(
    (tool) => tool.status === "skipped"
  ).length;
  const totalTools = payload.tools.length;
  const confidenceScore = calculateConfidenceScore({
    failedTools,
    skippedTools,
    successTools,
  });
  const transferBars = getWhaleTransferBars(payload);
  const marketSummary = getMarketVisualBars(payload);
  const yieldSummary = getYieldVisualBars(payload);

  return {
    confidenceData: [
      {
        fill: "var(--chart-2)",
        label: "Confidence",
        value: confidenceScore,
      },
      {
        fill: "var(--chart-5)",
        label: "Risk / gaps",
        value: Math.max(0, 100 - confidenceScore),
      },
    ],
    confidenceLabel:
      confidenceScore >= 80 ? "High" : confidenceScore >= 55 ? "Medium" : "Low",
    confidenceScore,
    failedTools,
    marketBars: marketSummary.bars,
    marketTopLabel: marketSummary.topLabel,
    sourceQualityData: [
      {
        count: successTools,
        fill: "var(--chart-2)",
        label: "OK",
      },
      {
        count: failedTools,
        fill: "var(--chart-5)",
        label: "Gap",
      },
      {
        count: skippedTools,
        fill: "var(--chart-3)",
        label: "Skip",
      },
    ],
    successTools,
    totalTools,
    whaleBars: transferBars.bars,
    whaleTopLabel: transferBars.topLabel,
    yieldBars: yieldSummary.bars,
    yieldTopLabel: yieldSummary.topLabel,
  };
}

function calculateConfidenceScore({
  failedTools,
  skippedTools,
  successTools,
}: {
  failedTools: number;
  skippedTools: number;
  successTools: number;
}) {
  if (!successTools) {
    return 20;
  }

  const base = 60;
  const depthBonus = Math.min(25, successTools * 5);
  const gapPenalty = failedTools * 15 + skippedTools * 8;

  return Math.max(10, Math.min(100, base + depthBonus - gapPenalty));
}

function getWhaleTransferBars(payload: OnChainToolFinalPayload) {
  const records = getRecordsForDomains(payload, ["smart_money"]);
  const transfers = records
    .map((record) => {
      const amount = readTransferAmount(record);
      const symbol =
        readString(record.tokenSymbol) ||
        readString(record.symbol) ||
        readString(record.tokenName) ||
        "token";

      return {
        amount,
        hash: readString(record.hash),
        symbol,
      };
    })
    .filter((transfer) => transfer.amount > 0)
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);

  return {
    bars: transfers.map((transfer, index) => ({
      amount: transfer.amount,
      label: `#${index + 1}`,
    })),
    topLabel: transfers[0]
      ? `${formatCompactNumber(transfers[0].amount)} ${transfers[0].symbol}`
      : "",
  };
}

function getMarketVisualBars(payload: OnChainToolFinalPayload) {
  const records = getRecordsForDomains(payload, [
    "market_data",
    "pair_liquidity",
    "token_security",
  ]);
  const metrics = records
    .map((record) => ({
      fdv: readNumber(record.fdv) || readNumber(record.marketCap),
      label: readPairLabel(record),
      liquidity: readNumber(readRecord(record.liquidity)?.usd),
      volume24h: readNumber(readRecord(record.volume)?.h24),
    }))
    .filter(
      (item) =>
        typeof item.liquidity === "number" ||
        typeof item.volume24h === "number" ||
        typeof item.fdv === "number"
    )
    .sort((left, right) => (right.liquidity ?? 0) - (left.liquidity ?? 0));
  const top = metrics[0];

  if (!top) {
    return { bars: [], topLabel: "" };
  }

  return {
    bars: [
      { label: "Liq", value: top.liquidity ?? 0 },
      { label: "Vol", value: top.volume24h ?? 0 },
      { label: "FDV", value: top.fdv ?? 0 },
    ].filter((item) => item.value > 0),
    topLabel: `${top.label} ${formatCompactCurrency(top.liquidity ?? top.volume24h ?? top.fdv ?? 0)}`,
  };
}

function getYieldVisualBars(payload: OnChainToolFinalPayload) {
  const reportRanked = getYieldReportBars(payload.report);

  if (reportRanked.bars.length) {
    return reportRanked;
  }

  const records = getRecordsForDomains(payload, ["defi_tvl", "yield_pools"]);
  const suiRecords = records.filter(isSuiRecord);
  const scopedRecords = suiRecords.length ? suiRecords : records;
  const ranked = scopedRecords
    .map((record) => {
      const value =
        readNumber(record.tvlUsd) ||
        readNumber(record.tvl) ||
        readNumber(record.totalLiquidityUsd) ||
        readSuiTvl(record);
      const apy =
        readNumber(record.apy) ||
        readNumber(record.apyBase) ||
        readNumber(record.apyReward);

      return {
        apy,
        label: shortenChartLabel(
          readString(record.project) ||
            readString(record.symbol) ||
            readString(record.name) ||
            readString(record.slug) ||
            "Pool"
        ),
        value: value ?? 0,
      };
    })
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);

  return {
    bars: ranked.map((item) => ({
      label: item.label,
      value: item.value,
    })),
    topLabel: ranked[0]
      ? `${ranked[0].label} ${formatCompactCurrency(ranked[0].value)}${
          typeof ranked[0].apy === "number" ? ` / ${ranked[0].apy.toFixed(2)}% APY` : ""
        }`
      : "",
  };
}

function getYieldReportBars(payloadReport: OnChainToolFinalPayload["report"]) {
  if (!payloadReport || payloadReport.kind !== "defi-yield") {
    return {
      bars: [] as Array<{ label: string; value: number }>,
      topLabel: "",
    };
  }

  const ranked = payloadReport.entities
    .map((entity) => {
      const metrics = readDefiRankingMetrics(entity);

      return {
        apy: metrics.bestApy,
        coverage: metrics.coverage,
        label: entity.label,
        shortLabel: shortenChartLabel(entity.label),
        score: metrics.score,
        value: metrics.tvlUsd ?? 0,
      };
    })
    .filter((item) => item.value > 0)
    .slice(0, 5);

  return {
    bars: ranked.map((item) => ({
      label: item.shortLabel,
      value: item.value,
    })),
    topLabel: ranked[0]
      ? `${ranked[0].label} ${formatCompactCurrency(ranked[0].value)}${
          typeof ranked[0].score === "number"
            ? ` / ${ranked[0].score.toFixed(1)} score`
            : ""
        }${ranked[0].coverage ? ` / ${ranked[0].coverage}` : ""}${
          typeof ranked[0].apy === "number"
            ? ` / ${ranked[0].apy.toFixed(2)}% APY`
            : ""
        }`
      : "",
  };
}

function getRecordsForDomains(
  payload: OnChainToolFinalPayload,
  domains: OnChainToolResult["domain"][]
) {
  const domainSet = new Set(domains);

  return payload.tools
    .filter((tool) => domainSet.has(tool.domain))
    .flatMap((tool) => getToolRecordSet(tool.data).records);
}

function readTransferAmount(record: Record<string, unknown>) {
  const rawValue = readString(record.value);

  if (rawValue) {
    return parseTokenAmount(
      rawValue,
      readInteger(record.tokenDecimal, 18, 0, 36)
    );
  }

  return (
    readNumber(record.amount) ||
    readNumber(record.valueUsd) ||
    readNumber(record.usdValue) ||
    0
  );
}

function parseTokenAmount(value: string, decimals: number) {
  if (value.includes(".")) {
    return Number(value) || 0;
  }

  if (decimals <= 0) {
    return Number(value) || 0;
  }

  try {
    const raw = BigInt(value);
    const base = BigInt(10) ** BigInt(decimals);
    const whole = raw / base;
    const fraction = raw % base;
    const text = `${whole.toString()}.${fraction
      .toString()
      .padStart(decimals, "0")
      .slice(0, 6)}`;

    return Number(text) || 0;
  } catch {
    return Number(value) || 0;
  }
}

function readPairLabel(record: Record<string, unknown>) {
  const baseToken = readRecord(record.baseToken);
  const quoteToken = readRecord(record.quoteToken);
  const base =
    readString(baseToken?.symbol) ||
    readString(record.symbol) ||
    readString(record.name) ||
    "Pair";
  const quote = readString(quoteToken?.symbol);

  return shortenChartLabel(quote ? `${base}/${quote}` : base);
}

function isSuiRecord(record: Record<string, unknown>) {
  const chain = readString(record.chain);

  if (chain.toLowerCase() === "sui") {
    return true;
  }

  return Array.isArray(record.chains)
    ? record.chains.some(
        (item) => typeof item === "string" && item.toLowerCase() === "sui"
      )
    : false;
}

function readSuiTvl(record: Record<string, unknown>) {
  const chainTvls = readRecord(record.chainTvls);
  const sui = readRecord(chainTvls?.Sui) || readRecord(chainTvls?.sui);

  return readNumber(sui?.tvl);
}

function readInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);

  return Number.isFinite(parsed)
    ? Math.min(Math.max(Math.trunc(parsed), minimum), maximum)
    : fallback;
}

function shortenChartLabel(value: string) {
  return value.length > 12 ? `${value.slice(0, 11)}...` : value;
}

function formatCompactCurrencyValue(value: unknown) {
  return formatCompactCurrency(
    typeof value === "number" ? value : Number(value) || 0
  );
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1_000 ? 1 : 2,
    notation: "compact",
  }).format(value);
}

function getOnChainToolState(
  status: OnChainToolResult["status"]
): ToolPart["state"] {
  if (status === "success") {
    return "output-available";
  }

  if (status === "skipped") {
    return "output-denied";
  }

  return "output-error";
}

function OnChainToolDataPreview({ tool }: { tool: OnChainToolResult }) {
  if (tool.data === undefined) {
    return null;
  }

  const synthesis = getSynthesisPreview(tool.data);

  if (synthesis) {
    return <OnChainSynthesisPreview synthesis={synthesis} />;
  }

  const recordSet = getToolRecordSet(tool.data);

  if (recordSet.records.length) {
    const visibleRecords = recordSet.records.slice(0, 5);

    return (
      <div className="overflow-hidden rounded-md border bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-2 py-1.5">
          <p className="font-medium text-foreground">Fetched output</p>
          <StatusPill
            label={recordSet.label}
            value={
              recordSet.total > visibleRecords.length
                ? `${visibleRecords.length} of ${recordSet.total}`
                : String(recordSet.total)
            }
          />
        </div>
        <div className="divide-y">
          {visibleRecords.map((record, index) => (
            <OnChainRecordPreview
              index={index}
              key={getRecordKey(record, index)}
              record={record}
              sourceUrl={tool.sourceUrl}
            />
          ))}
        </div>
      </div>
    );
  }

  return <OnChainStructuredPreview data={tool.data} />;
}

function OnChainRecordPreview({
  index,
  record,
  sourceUrl,
}: {
  index: number;
  record: Record<string, unknown>;
  sourceUrl?: string;
}) {
  const transfer = getTransferPreview(record, sourceUrl);

  if (transfer) {
    return <OnChainTransferRecordPreview transfer={transfer} />;
  }

  const baseToken = readRecord(record.baseToken);
  const quoteToken = readRecord(record.quoteToken);
  const tokenAddress =
    readString(record.tokenAddress) ||
    readString(record.address) ||
    readString(baseToken?.address);
  const title =
    readString(baseToken?.symbol) ||
    readString(record.symbol) ||
    readString(record.name) ||
    readString(baseToken?.name) ||
    (tokenAddress ? shortHash(tokenAddress) : `Record ${index + 1}`);
  const subtitle =
    readString(record.description) ||
    readString(record.label) ||
    readString(record.category) ||
    readString(baseToken?.name);
  const chain = readString(record.chainId) || readString(record.chain);
  const dex = readString(record.dexId) || readString(record.exchange);
  const quoteSymbol = readString(quoteToken?.symbol);
  const price = readString(record.priceUsd) || readString(record.price);
  const liquidity = readNumber(readRecord(record.liquidity)?.usd);
  const volume24h = readNumber(readRecord(record.volume)?.h24);
  const marketCap = readNumber(record.marketCap) || readNumber(record.fdv);
  const circulatingUsd =
    readNumber(readRecord(record.circulating)?.peggedUSD) ||
    readNumber(readRecord(record.circulating)?.usd) ||
    readNumber(record.circulatingUsd);
  const boostAmount = readNumber(record.totalAmount) || readNumber(record.amount);
  const url = readString(record.url) || readString(record.sourceUrl);
  const pegType = readString(record.pegType);
  const pegMechanism = readString(record.pegMechanism);

  return (
    <div className="flex flex-col gap-1.5 px-2 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">
          {quoteSymbol ? `${title}/${quoteSymbol}` : title}
        </span>
        {chain && <StatusPill label="Chain" value={chain} />}
        {dex && <StatusPill label="DEX" value={dex} />}
      </div>
      {subtitle && <p className="break-words">{subtitle}</p>}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {price && <span>Price {price}</span>}
        {typeof liquidity === "number" && (
          <span>Liquidity {formatUsd(liquidity)}</span>
        )}
        {typeof volume24h === "number" && (
          <span>24h volume {formatUsd(volume24h)}</span>
        )}
        {typeof marketCap === "number" && (
          <span>Market cap {formatUsd(marketCap)}</span>
        )}
        {typeof circulatingUsd === "number" && (
          <span>Supply {formatUsd(circulatingUsd)}</span>
        )}
        {typeof boostAmount === "number" && (
          <span>Boost {formatNumber(boostAmount)}</span>
        )}
        {pegType && <span>Peg {pegType}</span>}
        {pegMechanism && <span>Mechanism {pegMechanism}</span>}
      </div>
      {(tokenAddress || url) && (
        <div className="flex flex-col gap-1 text-xs">
          {tokenAddress && (
            <span className="break-all">Token {tokenAddress}</span>
          )}
          {url && (
            <a
              className="break-all text-foreground underline underline-offset-2"
              href={url}
              rel="noreferrer"
              target="_blank"
            >
              {url}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function OnChainTransferRecordPreview({
  transfer,
}: {
  transfer: TransferPreview;
}) {
  return (
    <div className="flex flex-col gap-2 px-2 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">
          {transfer.amount} {transfer.symbol}
        </span>
        {transfer.tokenName && (
          <StatusPill label="Token" value={transfer.tokenName} />
        )}
        {transfer.blockNumber && (
          <StatusPill label="Block" value={transfer.blockNumber} />
        )}
        {transfer.confirmations && (
          <StatusPill label="Conf" value={transfer.confirmations} />
        )}
      </div>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <PreviewField label="From" value={transfer.from} />
        <PreviewField label="To" value={transfer.to} />
        {transfer.txHash && (
          <PreviewField
            href={transfer.txUrl}
            label="Transaction"
            value={transfer.txHash}
          />
        )}
        {transfer.time && <PreviewField label="Time" value={transfer.time} />}
        {transfer.contractAddress && (
          <PreviewField label="Contract" value={transfer.contractAddress} />
        )}
      </div>
    </div>
  );
}

function PreviewField({
  href,
  label,
  value,
}: {
  href?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded border bg-background/60 px-2 py-1.5">
      <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
      {href ? (
        <a
          className="mt-0.5 block break-all text-foreground underline underline-offset-2"
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          {value}
        </a>
      ) : (
        <p className="mt-0.5 break-all text-foreground">{value}</p>
      )}
    </div>
  );
}

function OnChainStructuredPreview({ data }: { data: unknown }) {
  const preview = getStructuredPreview(data);

  if (!preview) {
    return (
      <div className="rounded-md border bg-muted/20 px-2 py-2 text-sm">
        <p className="font-medium text-foreground">Structured evidence</p>
        <p className="mt-1 text-muted-foreground">
          Evidence was captured. Use the source link and provider summary above
          for review.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-muted/20">
      <div className="flex flex-wrap items-center gap-2 border-b px-2 py-1.5">
        <p className="font-medium text-foreground">Structured evidence</p>
        <StatusPill label="Fields" value={String(preview.fields.length)} />
      </div>
      <div className="grid gap-2 px-2 py-2 sm:grid-cols-2">
        {preview.fields.map((field) => (
          <div
            className="rounded border bg-background/60 px-2 py-1.5"
            key={field.label}
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {field.label}
            </p>
            <p className="mt-0.5 break-words text-foreground">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OnChainSynthesisPreview({
  synthesis,
}: {
  synthesis: {
    completedTools?: number;
    failedTools?: number;
    summaries: string[];
  };
}) {
  return (
    <div className="overflow-hidden rounded-md border bg-muted/20">
      <div className="flex flex-wrap items-center gap-2 border-b px-2 py-1.5">
        <p className="font-medium text-foreground">Synthesis output</p>
        {typeof synthesis.completedTools === "number" && (
          <StatusPill
            label="Completed"
            value={String(synthesis.completedTools)}
          />
        )}
        {typeof synthesis.failedTools === "number" && (
          <StatusPill label="Failed" value={String(synthesis.failedTools)} />
        )}
      </div>
      <div className="flex flex-col gap-1 px-2 py-2">
        {synthesis.summaries.slice(0, 6).map((summary, index) => (
          <p className="break-words" key={`${summary}-${index}`}>
            {summary}
          </p>
        ))}
      </div>
    </div>
  );
}

function getToolRecordSet(data: unknown): {
  label: string;
  records: Array<Record<string, unknown>>;
  total: number;
} {
  const direct = toRecordArray(data);

  if (direct.length) {
    return { label: "Records", records: direct, total: direct.length };
  }

  const nested = findRecordSet(data, 0);

  if (nested) {
    return nested;
  }

  return { label: "Records", records: [], total: 0 };
}

const onChainRecordKeys = [
  "pairs",
  "data",
  "result",
  "items",
  "tokens",
  "rows",
  "transfers",
  "tokenBalances",
  "protocols",
  "pools",
  "peggedAssets",
];

function findRecordSet(
  data: unknown,
  depth: number
): { label: string; records: Array<Record<string, unknown>>; total: number } | null {
  if (depth > 3) {
    return null;
  }

  const root = readRecord(data);

  if (!root) {
    return null;
  }

  for (const key of onChainRecordKeys) {
    const records = toRecordArray(root[key]);

    if (records.length) {
      return {
        label: formatRecordLabel(key),
        records,
        total: records.length,
      };
    }
  }

  for (const key of onChainRecordKeys) {
    const nested = findRecordSet(root[key], depth + 1);

    if (nested) {
      return nested;
    }
  }

  return null;
}

function formatRecordLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (char) =>
    char.toUpperCase()
  );
}

function getSynthesisPreview(data: unknown) {
  const root = readRecord(data);

  if (!root || !Array.isArray(root.summaries)) {
    return null;
  }

  const summaries = root.summaries.filter(
    (summary): summary is string => typeof summary === "string"
  );

  if (!summaries.length) {
    return null;
  }

  return {
    completedTools: readNumber(root.completedTools),
    failedTools: readNumber(root.failedTools),
    summaries,
  };
}

function toRecordArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, unknown> => Boolean(readRecord(item))
  );
}

function getRecordKey(record: Record<string, unknown>, index: number) {
  return (
    readString(record.pairAddress) ||
    readString(record.tokenAddress) ||
    readString(record.address) ||
    readString(record.id) ||
    readString(record.symbol) ||
    readString(readRecord(record.baseToken)?.address) ||
    `${index}`
  );
}

function getStructuredPreview(data: unknown) {
  const root = readRecord(data);

  if (!root) {
    return null;
  }

  const fields = Object.entries(root)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return [
          {
            label: formatRecordLabel(key),
            value: `${value.length} records`,
          },
        ];
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return [
          {
            label: formatRecordLabel(key),
            value: String(value),
          },
        ];
      }

      const nested = readRecord(value);

      if (!nested) {
        return [];
      }

      const nestedFields = Object.entries(nested)
        .filter(([, nestedValue]) =>
          typeof nestedValue === "string" ||
          typeof nestedValue === "number" ||
          typeof nestedValue === "boolean"
        )
        .slice(0, 2)
        .map(
          ([nestedKey, nestedValue]) =>
            `${formatRecordLabel(nestedKey)}: ${nestedValue}`
        )
        .join(", ");

      return nestedFields
        ? [
            {
              label: formatRecordLabel(key),
              value: nestedFields,
            },
          ]
        : [];
    })
    .slice(0, 6);

  return fields.length ? { fields } : null;
}

type TransferPreview = {
  amount: string;
  blockNumber?: string;
  confirmations?: string;
  contractAddress?: string;
  from: string;
  symbol: string;
  time?: string;
  to: string;
  tokenName?: string;
  txHash?: string;
  txUrl?: string;
};

function getTransferPreview(
  record: Record<string, unknown>,
  sourceUrl?: string
): TransferPreview | null {
  const from = readString(record.from);
  const to = readString(record.to);
  const rawValue = readString(record.value);

  if (!from || !to || !rawValue) {
    return null;
  }

  const symbol = readString(record.tokenSymbol) || "token";
  const amount = formatTokenUnit(
    rawValue,
    readTokenDecimals(record.tokenDecimal)
  );
  const txHash = readString(record.hash);

  return {
    amount,
    blockNumber: readString(record.blockNumber) || undefined,
    confirmations: readString(record.confirmations) || undefined,
    contractAddress: readString(record.contractAddress) || undefined,
    from,
    symbol,
    time: formatUnixTimestamp(readString(record.timeStamp)),
    to,
    tokenName: readString(record.tokenName) || undefined,
    txHash: txHash || undefined,
    txUrl: txHash ? buildTxExplorerUrl(sourceUrl, txHash) : undefined,
  };
}

function readTokenDecimals(value: unknown) {
  const parsed = Number.parseInt(readString(value), 10);

  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 36) : 18;
}

function formatTokenUnit(rawValue: string, decimals: number) {
  const raw = rawValue.trim();

  if (!/^\d+$/.test(raw)) {
    return rawValue;
  }

  if (decimals <= 0) {
    return formatIntegerString(raw);
  }

  const padded = raw.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals).replace(/^0+(?=\d)/, "") || "0";
  const fraction = padded.slice(-decimals).slice(0, 6).replace(/0+$/, "");

  return `${formatIntegerString(whole)}${fraction ? `.${fraction}` : ""}`;
}

function formatIntegerString(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatUnixTimestamp(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(parsed * 1000));
}

function buildTxExplorerUrl(sourceUrl: string | undefined, txHash: string) {
  if (!sourceUrl) {
    return undefined;
  }

  try {
    const chain = new URL(sourceUrl).searchParams.get("chain");

    if (chain?.toLowerCase() === "sui") {
      return `https://suivision.xyz/txblock/${txHash}`;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function readDefiRankingMetrics(
  entity: ResearchReportEntity
): DefiRankingMetrics {
  return {
    bestApy: readMetricNumber(entity.metrics.bestApy),
    coverage: readCoverageMetric(entity.metrics.coverage),
    momentumScore: readMetricNumber(entity.metrics.momentumScore),
    poolCount: readMetricNumber(entity.metrics.poolCount),
    score: readMetricNumber(entity.metrics.score),
    tvlUsd: readMetricNumber(entity.metrics.tvlUsd),
  };
}

function readMetricNumber(value: string | number | null | undefined) {
  return readNumber(value);
}

function readCoverageMetric(
  value: string | number | null | undefined
): DefiRankingCoverage | null {
  return value === "composite" || value === "tvl+apy" || value === "context-only"
    ? value
    : null;
}

function shortHash(value: string) {
  return value.length > 14 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 0 : 6,
    style: "currency",
  }).format(value);
}

function getUIMessageReasoning(message: Pick<LangclawUIMessage, "parts">) {
  return message.parts
    .filter((part) => part.type === "reasoning")
    .map((part) => part.text)
    .join("")
    .trim();
}

function getVisibleReasoningText(
  message: Pick<LangclawUIMessage, "metadata" | "parts">
) {
  return (
    getUIMessageReasoning(message) ||
    message.metadata?.reasoningText?.trim() ||
    ""
  );
}

function getMessageTokenUsage(message: StoredChatMessage) {
  if (message.role === "user") {
    return {
      inputTokens: estimateTokens(message.content),
      source: "estimated",
    };
  }

  const actualUsage =
    message.directAnswer?.usage ?? message.result?.usage ?? message.onChain?.usage;

  if (actualUsage) {
    const inputTokens = actualUsage.inputTokens ?? actualUsage.promptTokens;
    const outputTokens =
      actualUsage.outputTokens ?? actualUsage.completionTokens;
    const totalTokens =
      actualUsage.totalTokens ??
      (typeof inputTokens === "number" && typeof outputTokens === "number"
        ? inputTokens + outputTokens
        : undefined);

    if (
      typeof inputTokens === "number" ||
      typeof outputTokens === "number" ||
      typeof totalTokens === "number"
    ) {
      return {
        inputTokens,
        outputTokens,
        source: "actual",
        totalTokens,
      };
    }
  }

  if (!message.content.trim()) {
    return null;
  }

  return {
    outputTokens: estimateTokens(message.content),
    source: "estimated",
  };
}

function getRouterUsage(message: StoredChatMessage) {
  return message.directAnswer?.usage ?? message.result?.usage ?? message.onChain?.usage;
}

function getRouterUsageCostNeuron(
  usage: DirectChatUsage | ModelUsageReceipt
) {
  if ("chargedNeuron" in usage) {
    return usage.chargedNeuron;
  }

  return usage.totalCostNeuron;
}

function getLatestAssistantMessageId(messages: LangclawUIMessage[]) {
  return [...messages].reverse().find((message) => message.role === "assistant")
    ?.id;
}

function buildReasoningText(message: StoredChatMessage) {
  if (message.onChain && !message.result) {
    const payload = message.onChain;
    const tools = payload.tools.map(
      (tool) => `- ${tool.provider}: ${tool.title} ${tool.status}`,
    );

    return [
      `Intent: ${payload.plan.intent}`,
      `Chain: ${payload.plan.chain}`,
      ...tools,
    ].join("\n");
  }

  if (message.result) {
    const payload = message.result;
    const topTrend = payload.agentOutputs?.trend?.topTrend;
    const lines = [
      `Runtime: ${payload.orchestration.runtime}`,
      payload.finalAnswerMeta?.synthesis
        ? `Synthesis: ${payload.finalAnswerMeta.synthesis}`
        : undefined,
      payload.signals
        ? `Live signals: combined ${payload.signals.combined.status}, social ${payload.signals.social.status}, on-chain ${payload.signals.onchain.status}`
        : undefined,
      payload.signals?.combined?.summary,
      topTrend ? `Top trend: ${topTrend}` : undefined,
      payload.onChain
        ? `On-chain enrichment: ${payload.onChain.plan.intent} on ${payload.onChain.plan.chain}`
        : payload.onChainSkippedReason
          ? `On-chain enrichment: skipped. ${payload.onChainSkippedReason}`
          : undefined,
      payload.finalConclusion.summary,
      ...payload.finalConclusion.keySignals.map(
        (signal) => `- ${signal.label}: ${signal.text}`,
      ),
    ];

    return lines.filter(Boolean).join("\n");
  }

  if (message.progressEvents?.length) {
    return message.progressEvents
      .map((event) => `- ${event.agent}: ${event.summary}`)
      .join("\n");
  }

  if (message.directAnswer) {
    const payload = message.directAnswer;
    const model = payload.usedModel ?? payload.model ?? payload.requestedModel;
    const lines = [
      "Route selected: chat.",
      payload.source ? `Provider: ${payload.source}` : undefined,
      model ? `Model: ${model}` : undefined,
      payload.modelHonored === false && payload.fallbackFrom
        ? `Fallback from: ${payload.fallbackFrom}`
        : undefined,
      "Plan: answer directly, preserve the user's language, and format with clear Markdown when helpful.",
    ];

    return lines.filter(Boolean).join("\n");
  }

  return "";
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function formatNumber(value?: number) {
  return value === undefined ? "Not available" : value.toLocaleString();
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

function LoadingMessages() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-3/4" />
      <Skeleton className="ml-auto h-16 w-2/3" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

function SpeechTranscriptionPreview({
  segments,
}: {
  segments: TranscriptionSegments;
}) {
  if (!segments.length) {
    return null;
  }

  return (
    <div className="border-b px-3 py-2">
      <Transcription segments={segments}>
        {(segment, index) => (
          <TranscriptionSegment
            index={index}
            key={`${segment.startSecond}-${segment.text}`}
            segment={segment}
          />
        )}
      </Transcription>
    </div>
  );
}

function appendSpeechText(currentText: string, transcript: string) {
  const next = transcript.trim();

  if (!next) {
    return currentText;
  }

  return currentText.trim() ? `${currentText.trim()} ${next}` : next;
}

function appendTranscriptionSegment(
  segments: TranscriptionSegments,
  text: string,
): TranscriptionSegments {
  const transcript = text.trim();

  if (!transcript) {
    return segments;
  }

  const startSecond = segments.at(-1)?.endSecond ?? 0;
  const duration = Math.max(1, Math.ceil(transcript.split(/\s+/).length / 2));

  return [
    ...segments,
    {
      endSecond: startSecond + duration,
      startSecond,
      text: transcript,
    },
  ];
}

export default Chat;
