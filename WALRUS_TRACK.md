# Langclaw — Walrus Track Submission

> **Walrus as a Verifiable Data Platform for AI.** Langclaw is an autonomous
> alpha-research agent whose long-term memory lives on **Walrus**: every research
> run is Seal-encrypted, stored as a Walrus blob, re-fetched and hash-verified,
> anchored on Sui as a portable pointer, and indexed for semantic recall through
> **MemWal**. Memory is durable, portable across devices, owner-private, and
> independently auditable — not trapped in a single app, model, or machine.

This document is the judge-facing map. Deep technical detail and the live
verification tables live in [`backend/README.md`](backend/README.md)
("Current Walrus Verification").

---

## 1. Why Walrus is central (not a wrapper)

Walrus **is** the agent's memory substrate. Remove it and the product loses its
defining capability: the agent stops remembering across runs and devices.

The main product action — `POST /api/discover` (and `/api/discover/stream`,
`/api/chat/stream`) — does **not** call the bare research engine. It calls
`runPrivateMemoryWorkflow`, the Sui+Walrus memory layer that wraps it:

- [`backend/src/routes/discover.ts:60`](backend/src/routes/discover.ts) →
  [`backend/src/lib/memory-workflow.ts`](backend/src/lib/memory-workflow.ts)

Every run executes this pipeline:

```
recall prior memory (MemWal semantic + on-chain pointers + metadata index)
   ↓  inject recalled context into the agent
run staged research agents (planner → discovery → trend → evidence → verifier → conclusion)
   ↓
Seal-encrypt the evidence artifact (owner-gated threshold encryption)
   ↓
store the encrypted blob on Walrus  ──►  re-fetch + hash-compare (store→read-back→verify)
   ↓
store inter-agent handoffs on Walrus (re-fetched + decrypted on later runs)
   ↓
anchor a metadata-only pointer on Sui (MemoryRecorded event) + redacted MemWal pointer
```

Source modules:

| Concern | File |
| --- | --- |
| Walrus blob store/read (HTTP publisher+aggregator, local fallback) | [`backend/src/lib/walrus.ts`](backend/src/lib/walrus.ts) |
| Seal threshold encryption (real `@mysten/seal`, owner-gated) | [`backend/src/lib/seal.ts`](backend/src/lib/seal.ts) |
| MemWal semantic recall adapter | [`backend/src/lib/memwal.ts`](backend/src/lib/memwal.ts) |
| On-chain pointer index / recall-from-chain | [`backend/src/lib/sui-memory-index.ts`](backend/src/lib/sui-memory-index.ts) |
| Move package (`memory_registry`, `access_policy`) | [`move/langclaw_memory/`](move/langclaw_memory/) |
| Orchestration | [`backend/src/lib/memory-workflow.ts`](backend/src/lib/memory-workflow.ts) |

---

## 2. How we meet the three judging criteria

### ① Real use of Walrus — memory & data flow through it

- Research artifacts are stored as **Walrus blobs** through the configured
  Walrus publisher and read back from the mainnet aggregator
  (`https://aggregator.walrus-mainnet.walrus.space`).
- **Inter-agent handoffs** (planner/trend/evidence/verifier outputs) are stored
  as Walrus blobs and **re-fetched + decrypted on later runs** — Walrus is shared
  agent state across runs, not a write-only sink.
- **MemWal** (Walrus-backed memory relayer) provides semantic recall over the
  encrypted memory index. Verified live `remember → recall` round trip.

### ② Agent functionality — it completes real tasks

- Langclaw runs a multi-stage research agent that produces a cited alpha-research
  report (on-chain/market data via Alchemy, Dune, Nansen, GoPlus, DeFiLlama, DEX
  Screener, etc.) with honest source-gap reporting.
- Recalled prior memory is injected into the next run, so the agent **adapts
  based on past experience** rather than restarting cold each time.

### ③ Verifiability — data on Walrus is auditable

- **Store → read-back → hash-compare** on every run
  ([`memory-workflow.ts` `verifyWalrusRoundTrip`](backend/src/lib/memory-workflow.ts)):
  the proof claims "retrievable", not merely "uploaded".
- The on-chain `MemoryRecorded` event carries the `walrus_blob_id`, so anyone can
  go event → aggregator GET → confirm the exact blob (and its content hash)
  independently, with **no local state**.
- The UI surfaces the proof honestly (blob URL, hash-verified, Seal mode, MemWal
  status) and distinguishes live Walrus network vs local fallback
  ([`frontend/components/LangclawResult.tsx` `WalrusMemoryDetails`](frontend/components/LangclawResult.tsx)).

---

## 3. Mainnet status

| Layer | Evidence |
| --- | --- |
| Walrus memory blobs | ✅ **live on mainnet** — own publisher daemon + public aggregator; `storageStatus: uploaded`, `hashVerified: true`. Example blob `o-FHoM1krsuEWyJZ6LrWkN2OhNqs5_k5PCFRaroFiu4` |
| Agent-handoff blobs (Walrus shared state) | ✅ **live** — same store → re-fetch → decrypt loop; e.g. blob `25sqhXLdWpMukoZ5snq-3uVi473W0X5aSNUtVanPIeo` |
| MemWal | ✅ **live** — relayer `https://relayer.memory.walrus.xyz`; redacted pointer `remember → recall` round trip verified |
| Sui memory anchor | ✅ **live on mainnet** — `memory_registry::record_memory` at package `0x7f3578ebe174b0343cd96391b2a1c75d5db4ad82c793650b3950bdb5634192e5` emits `MemoryRecorded` carrying the `walrus_blob_id`. Example tx [`aK7QiQdnbEXKtrHSZ5qifWcbfcBbu7UsFHsDjDFfR1H`](https://suivision.xyz/txblock/aK7QiQdnbEXKtrHSZ5qifWcbfcBbu7UsFHsDjDFfR1H) |
| Seal | ✅ **real Seal SDK threshold encryption verified live on mainnet** through a self-hosted Open mode server. KeyServer object [`0x86b608dc…`](https://suivision.xyz/object/0x86b608dcb3fcb9c629cfe6d865681977d1decb219a2eb98eb6058b87377feaf3), registration tx [`5dbnWf…`](https://suivision.xyz/txblock/5dbnWfCpMY1aWALrayaDkWAiBH5TSFYWdhERbxFfRxV1) |

The full audit chain anyone can reproduce with no local state:
**on-chain tx → `MemoryRecorded` event → `walrus_blob_id` → aggregator GET → confirm the exact encrypted blob + its content hash.**

Full tables: [`backend/README.md`](backend/README.md) → "Current Walrus Verification".

---

## 4. Reproduce the verification yourself

```bash
cd backend
cp .env.example .env          # then fill Walrus + Seal + MemWal vars (see README)

npm run check:walrus-readiness   # all adapters report ready / live mode
npm run smoke:memwal             # live MemWal remember → recall round trip
npm run demo:walrus-public       # publish a PUBLIC sample memory you can read in full
npm run proof:walrus-mainnet -- "your topic"
npm run proof:seal
npm run verify:public-proof

# Read a live PUBLIC demo memory's full content straight from Walrus (no key):
curl -s https://aggregator.walrus-mainnet.walrus.space/v1/blobs/<public_blob_id>

# Independent audit of a real (encrypted) memory (no app needed):
#   read the MemoryRecorded event → take walrus_blob_id →
curl -s https://aggregator.walrus-mainnet.walrus.space/v1/blobs/<walrus_blob_id> | head -c 400
```

---

## 5. Honest scope

- **Owner privacy:** real memory artifacts are Seal-encrypted and owner-gated, so a
  judge can confirm a blob exists + hash-matches publicly, but reading the
  plaintext needs the owner's Seal session. Only redacted metadata (topic +
  hashes + Walrus ids) is sent to MemWal (`MEMWAL_ALLOW_PRIVATE_SUMMARY=false`).
  For a fully readable end-to-end audit, `npm run demo:walrus-public` publishes a
  deliberately **unencrypted** sample memory after `WALRUS_PUBLISHER_URL` is
  configured for mainnet. Anyone can then run the store -> retrieve -> read loop
  without a key.
- **Local fallback:** with no credentials the whole flow still runs against
  on-disk/AES fallbacks and reports `walrusStorageMode: local` honestly — it
  never fakes a public blob URL or an on-chain tx.
- **Walrus Sites:** `walrus-site/` is published on mainnet as object
  `0x423a0cf7bfa109ed48ae6fae63eead7b7eae751b0885925b137bfd1d9e597d2b`.
  Deployment metadata lives in `walrus-site/PUBLISH.md`.
- **Sui Stack Messaging — not used (deliberate):** agent handoffs use durable,
  auditable Walrus blobs instead of ephemeral messages; live agent-to-agent
  channels via Stack Messaging are a candidate future integration.
