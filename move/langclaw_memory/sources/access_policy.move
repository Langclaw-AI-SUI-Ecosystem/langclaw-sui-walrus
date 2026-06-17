/// Seal access policy for Langclaw private memory.
///
/// The Seal encryption identity is the owner's 32-byte Sui address. Seal key
/// servers dry-run `seal_approve` with the requester (the SessionKey's address)
/// as the transaction sender, so a key share is released only when the requester
/// equals the owner encoded in `id` — an owner-only gate enforced on-chain
/// instead of by a server-side string comparison.
module langclaw_memory::access_policy {
    use sui::address;

    /// The requester is not the owner of this memory identity.
    const ENoAccess: u64 = 0;

    /// `id` must be exactly the 32-byte owner address. `address::from_bytes`
    /// aborts on any other length, so malformed identities are rejected too.
    entry fun seal_approve(id: vector<u8>, ctx: &TxContext) {
        assert!(ctx.sender() == address::from_bytes(id), ENoAccess);
    }
}
