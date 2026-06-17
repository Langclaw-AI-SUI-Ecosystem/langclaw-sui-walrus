/// Public, metadata-only proof of an encrypted Walrus memory artifact.
///
/// This module never receives private content. It records only the hashes and
/// pointers needed to audit that an encrypted memory exists on Walrus, mirroring
/// the privacy invariant enforced by the backend (see CLAUDE.md).
module langclaw_memory::memory_registry {
    use std::string::String;
    use sui::event;

    /// Emitted for every private memory artifact stored on Walrus.
    public struct MemoryRecorded has copy, drop {
        run_id: String,
        content_hash: String,
        walrus_blob_id: String,
        walrus_object_id: String,
        seal_policy_id: String,
        owner: address,
        recorder: address,
    }

    /// Record metadata-only proof of an encrypted Walrus memory.
    /// Argument order matches `buildMoveArguments` in `backend/src/lib/sui-registry.ts`.
    public fun record_memory(
        run_id: String,
        content_hash: String,
        walrus_blob_id: String,
        walrus_object_id: String,
        seal_policy_id: String,
        owner: address,
        ctx: &TxContext,
    ) {
        event::emit(MemoryRecorded {
            run_id,
            content_hash,
            walrus_blob_id,
            walrus_object_id,
            seal_policy_id,
            owner,
            recorder: ctx.sender(),
        });
    }
}
