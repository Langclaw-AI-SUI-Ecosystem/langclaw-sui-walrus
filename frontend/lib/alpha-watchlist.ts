import type {
  AlphaWatchlistItem,
  OnChainToolFinalPayload,
} from "@/lib/langclaw-api";

export type { AlphaWatchlistItem };

export const LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT =
  "langclaw-alpha-watchlist-updated";

export function buildAlphaWatchlistItem(
  payload: OnChainToolFinalPayload,
): AlphaWatchlistItem {
  const chainProof = payload.proof?.chain;
  const successfulTools = payload.tools.filter(
    (tool) => tool.status === "success",
  );
  const failedTools = payload.tools.filter((tool) => tool.status === "failed");
  const subject =
    payload.plan.tokenAddress ||
    payload.plan.walletAddress ||
    payload.plan.query ||
    payload.plan.intent;
  const proofAnchor =
    chainProof?.txHash || chainProof?.decisionId || chainProof?.decisionHash;
  const id = proofAnchor
    ? `proof:${proofAnchor}`
    : `signal:${stableHash([payload.generatedAt, payload.title, subject].join("|"))}`;

  return {
    addedAt: new Date().toISOString(),
    agentId: chainProof?.agentId,
    caveat: payload.caveat,
    chain: payload.plan.chain,
    decisionHash: chainProof?.decisionHash,
    decisionId: chainProof?.decisionId,
    evidenceUri: payload.proof?.storage.evidenceUri,
    explorerUrl: chainProof?.explorerUrl,
    gapCount: failedTools.length,
    id,
    intent: payload.plan.intent,
    proofTx: chainProof?.txHash,
    recommendation: payload.recommendation,
    signalType: chainProof?.signalType || inferSignalType(payload),
    sourceCount: successfulTools.length,
    subject,
    summary: payload.answer || payload.bullets[0] || payload.title,
    title: payload.title,
  };
}

export function dispatchAlphaWatchlistUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(LANGCLAW_ALPHA_WATCHLIST_UPDATED_EVENT));
}

function inferSignalType(payload: OnChainToolFinalPayload) {
  if (payload.plan.commands.some((command) => command.domain === "smart_money")) {
    return "smart-money";
  }

  if (
    payload.plan.commands.some((command) => command.domain === "pair_liquidity")
  ) {
    return "liquidity";
  }

  if (
    payload.plan.commands.some(
      (command) => command.domain === "trading_signal_analysis",
    )
  ) {
    return "trading-signal";
  }

  return "analysis";
}

function stableHash(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
}
