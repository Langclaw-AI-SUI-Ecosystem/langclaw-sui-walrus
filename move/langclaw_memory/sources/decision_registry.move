/// Public, metadata-only proof of an agent research decision.
///
/// Mirrors the EVM `LangclawRegistry.recordAgentDecision`. Like `memory_registry`,
/// this module stores NO persistent on-chain objects — it only emits an auditable
/// event. The canonical evidence lives off-chain at `evidence_uri`; the chain
/// carries a content hash (`decision_hash`) + provenance (`recorder`) so a
/// decision can be proven to have existed at a point in time.
module langclaw_memory::decision_registry {
    use std::string::String;
    use sui::event;

    /// Emitted for every anchored agent decision. `decision_hash` is the hex
    /// string of the canonical evidence-bundle hash computed off-chain by the
    /// backend (see `backend/src/lib/langclaw/proof.ts`).
    public struct DecisionRecorded has copy, drop {
        agent_id: u64,
        run_id: String,
        decision_hash: String,
        evidence_uri: String,
        signal_type: String,
        recorder: address,
    }

    /// Anchor an agent research decision. Permissionless; `recorder` is stamped
    /// from the sender. Argument order matches the backend `tx.pure` builder and
    /// the EVM `recordAgentDecision(agentId, runId, decisionHash, evidenceUri, signalType)`.
    public fun record_agent_decision(
        agent_id: u64,
        run_id: String,
        decision_hash: String,
        evidence_uri: String,
        signal_type: String,
        ctx: &TxContext,
    ) {
        event::emit(DecisionRecorded {
            agent_id,
            run_id,
            decision_hash,
            evidence_uri,
            signal_type,
            recorder: ctx.sender(),
        });
    }
}
