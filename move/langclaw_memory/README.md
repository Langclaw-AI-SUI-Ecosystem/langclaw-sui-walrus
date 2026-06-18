# langclaw_memory (Sui Move)

On-chain layer for Langclaw's private memory agent. Two responsibilities:

| Module | Function | Purpose |
| --- | --- | --- |
| `memory_registry` | `record_memory(run_id, content_hash, walrus_blob_id, walrus_object_id, seal_policy_id, owner)` | Emits a `MemoryRecorded` event — **metadata-only**, publicly auditable proof that an encrypted Walrus memory exists. Never receives private content. |
| `access_policy` | `seal_approve(id)` | Seal access policy. The encryption identity is the owner's 32-byte address; key servers grant a decryption share only when the requester (the SessionKey's sender) equals `address::from_bytes(id)`. Owner-only access enforced **on-chain**, not by a server. |

## Deployment (Sui mainnet)

| Item | Value |
| --- | --- |
| Package ID | `0x7f3578ebe174b0343cd96391b2a1c75d5db4ad82c793650b3950bdb5634192e5` |
| Usage Vault object | `0x816064d45dfe06194a973bce4b38a137365bbd6979c61b0d09435b7a443f3eff` |
| AdminCap object | `0x21314b9534ca673cac1c79d6d1a63b9b0469d684504c974d3e8a5588873e8d09` |
| Network | mainnet |

The same package ID is used by the backend for both `SUI_REGISTRY_PACKAGE_ID`
(registry proof) and `SEAL_PACKAGE_ID` (Seal access policy).

## Build / publish

```bash
sui move build
sui client publish --gas-budget 200000000
sui client call --package <packageId> --module usage_vault --function create_vault --gas-budget 100000000
```

After publishing, set in `backend/.env`:

```bash
SUI_REGISTRY_ENABLED=true
SUI_REGISTRY_PACKAGE_ID=<packageId>
SEAL_MOCK_MODE=false
SEAL_PACKAGE_ID=<packageId>
SEAL_KEY_SERVER_OBJECT_IDS=0x86b608dcb3fcb9c629cfe6d865681977d1decb219a2eb98eb6058b87377feaf3
SEAL_THRESHOLD=1
SEAL_STRICT_MODE=true
```

The configured object is a live, self-hosted Open mode KeyServer on mainnet.
Open mode does not need API key variables. The server uses a stable HTTPS URL,
and its master key stays outside source control.

## How the backend uses it

1. `POST /api/discover` builds an evidence artifact and encrypts it with Seal
   to the owner's identity, then stores it on Walrus.
2. `memory_registry::record_memory` is called to emit on-chain proof
   (blob id, content hash, Seal policy, owner).
3. A later related run decrypts prior memories via Seal — key servers dry-run
   `access_policy::seal_approve` to enforce owner-only access — and feeds them to
   the LLM agent for durable private recall.

## Tests

```bash
sui move test
```

The suite checks memory event emission, owner access, and non-owner rejection.
