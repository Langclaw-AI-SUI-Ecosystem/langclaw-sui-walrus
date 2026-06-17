/// Public, metadata-only anchor for a Strategy Lab backtest / paper-trade result.
///
/// Mirrors the EVM `LangclawTradingJournal.recordStrategyRun`. Events-only, like
/// `memory_registry` / `decision_registry`: backtesting only, no live funds. The
/// canonical row lives off-chain (Strategy Lab result + `evidence_uri`); the chain
/// carries the decision/result hashes + provenance for auditability.
module langclaw_memory::trading_journal {
    use std::string::String;
    use sui::event;

    /// Emitted for every anchored strategy run. Move has no native signed int,
    /// so the EVM `int256 pnlBps` is split into an unsigned magnitude
    /// (`pnl_bps`) plus a sign flag (`pnl_negative`) by the backend.
    public struct StrategyRunRecorded has copy, drop {
        agent_id: u64,
        run_id: String,
        strategy_id: String,
        market: String,
        decision_hash: String,
        result_hash: String,
        evidence_uri: String,
        action: String,
        pnl_bps: u64,
        pnl_negative: bool,
        status: String,
        recorder: address,
    }

    /// Anchor a backtest / paper-trade result. Permissionless; `recorder` is
    /// stamped from the sender. Argument order matches the backend `tx.pure`
    /// builder and the EVM `recordStrategyRun(agentId, runId, strategyId, market,
    /// decisionHash, resultHash, evidenceUri, action, pnlBps, status)`.
    public fun record_strategy_run(
        agent_id: u64,
        run_id: String,
        strategy_id: String,
        market: String,
        decision_hash: String,
        result_hash: String,
        evidence_uri: String,
        action: String,
        pnl_bps: u64,
        pnl_negative: bool,
        status: String,
        ctx: &TxContext,
    ) {
        event::emit(StrategyRunRecorded {
            agent_id,
            run_id,
            strategy_id,
            market,
            decision_hash,
            result_hash,
            evidence_uri,
            action,
            pnl_bps,
            pnl_negative,
            status,
            recorder: ctx.sender(),
        });
    }
}
