# Langclaw Sui Alpha

> **Walrus as a Verifiable Data Platform for AI.** A Sui-first autonomous alpha-research
> agent whose long-term memory lives on **Walrus**: every research run is Seal-encrypted,
> stored as a Walrus blob, re-fetched and hash-verified, anchored on Sui, and indexed for
> semantic recall through **MemWal**. Memory is durable, portable, owner-private, and
> independently auditable — not trapped in a single app, model, or machine.

**Sui Walrus Track submission.** Judge-facing map: [`WALRUS_TRACK.md`](WALRUS_TRACK.md).

---

## What it does

Langclaw runs a multi-stage research agent that produces a cited alpha-research report
over on-chain/market data, then **remembers** every run on Walrus so the next run builds
on prior reasoning instead of starting cold.

```
recall prior memory (MemWal semantic + on-chain pointers)
   ↓  inject recalled context into the agent
run staged research agents (planner → discovery → trend → evidence → verifier → conclusion)
   ↓
Seal-encrypt the evidence artifact (owner-gated)
   ↓
store the encrypted blob on Walrus  ──►  re-fetch + hash-compare (store → read-back → verify)
   ↓
store inter-agent handoffs on Walrus (re-fetched + decrypted on later runs)
   ↓
anchor a metadata-only pointer on Sui + redacted MemWal pointer
```

Walrus **is** the memory substrate — remove it and the agent stops remembering across runs
and devices. The main product action (`POST /api/discover`) does not call the bare research
engine; it calls `runPrivateMemoryWorkflow`, the Sui + Walrus memory layer wrapped around it.

---

## Repository layout

| Path | Stack | Role |
| --- | --- | --- |
| [`backend/`](backend/) | Node `http` server, TypeScript, ESM (npm) | Research workflow + Walrus / Seal / MemWal memory layer + Sui billing/proofs |
| [`frontend/`](frontend/) | Next.js 16, React 19, Tailwind v4 (pnpm) | Sui wallet UI (`@mysten/dapp-kit`), research + memory surfaces |
| [`move/langclaw_memory/`](move/langclaw_memory/) | Sui Move | `memory_registry`, `access_policy`, `usage_vault`, `decision_registry`, `trading_journal` |
| [`walrus-site/`](walrus-site/) | Static bundle | Judge-facing site prepared for Walrus Sites |

The Walrus memory layer lives in `backend/src/lib/`: `memory-workflow.ts` (orchestration),
`walrus.ts` (blob store/read), `seal.ts` (encryption), `memwal.ts` (semantic recall),
`sui-memory-index.ts` (on-chain pointer index).

---

## Live verification (Walrus mainnet)

These blobs were produced by the running backend and are retrievable by anyone, with no
local state — read them straight from the public mainnet aggregator:

```bash
# Public demo memory (intentionally unencrypted, full content readable):
curl -s https://aggregator.walrus-mainnet.walrus.space/v1/blobs/dFpx2A6pTOfEL41vTsOmMPo6LTMZ9aWlHsR24FwnanA

# Real Seal-encrypted research memory (returns aes-256-gcm ciphertext envelope):
curl -s https://aggregator.walrus-mainnet.walrus.space/v1/blobs/UCTZMMFfYKM9OHwjYd9TfehDGp-D6akMt-7T4tsM_Uc | head -c 200

# Inter-agent handoff bundle (Walrus as shared agent state across runs):
curl -s https://aggregator.walrus-mainnet.walrus.space/v1/blobs/25sqhXLdWpMukoZ5snq-3uVi473W0X5aSNUtVanPIeo | head -c 200
```

Reproduce the full pipeline yourself:

```bash
cd backend
cp .env.example .env            # fill Walrus + MemWal vars (see backend/README.md)
npm install
npm run check:walrus-readiness  # adapters report ready / http live mode
npm run demo:walrus-public      # publish a PUBLIC sample memory, then read it back
npm run smoke:memwal            # live MemWal remember → recall round trip
node --import tsx --env-file=.env scripts/walrus-mainnet-proof.ts "your topic"

# Real Seal threshold encryption round trip:
#   use the mainnet self-host/provider config in backend/.env.example, then:
node --import tsx --env-file=.env scripts/seal-roundtrip-proof.ts
```

---

## How it meets the three judging criteria

1. **Real use of Walrus** — research artifacts and inter-agent handoffs are stored as Walrus
   blobs and re-fetched + decrypted on later runs; MemWal (Walrus-backed) provides semantic
   recall. Walrus is shared agent state, not a write-only sink.
2. **Agent functionality** — a multi-stage research agent produces cited reports with honest
   source-gap reporting; recalled prior memory is injected so the agent adapts over time.
3. **Verifiability** — **store → read-back → hash-compare** on every run; the proof claims
   "retrievable", not merely "uploaded". Anyone can go blob id → aggregator GET → confirm the
   exact blob and its content hash with no local state.

---

## Honest scope (current status)

| Layer | Status |
| --- | --- |
| Walrus blob storage | ✅ **live on mainnet** (own publisher daemon + public aggregator) |
| MemWal semantic recall | ✅ **live** (`relayer.memory.walrus.xyz`) |
| Store → read-back → hash-verify | ✅ **live**, `hashVerified: true` |
| Sui memory anchor | ✅ **live on mainnet** — `MemoryRecorded` event at package `0x7f3578eb…` carries the `walrus_blob_id`; e.g. tx [`aK7QiQ…`](https://suivision.xyz/txblock/aK7QiQdnbEXKtrHSZ5qifWcbfcBbu7UsFHsDjDFfR1H) |
| Seal encryption | ✅ **real `@mysten/seal` threshold encryption verified live on mainnet** through a self-hosted Open mode server. KeyServer object [`0x86b608dc…`](https://suivision.xyz/object/0x86b608dcb3fcb9c629cfe6d865681977d1decb219a2eb98eb6058b87377feaf3), registration tx [`5dbnWf…`](https://suivision.xyz/txblock/5dbnWfCpMY1aWALrayaDkWAiBH5TSFYWdhERbxFfRxV1) |
| Walrus Sites | ✅ **published on mainnet** as site object [`0x423a0cf7…`](https://suivision.xyz/object/0x423a0cf7bfa109ed48ae6fae63eead7b7eae751b0885925b137bfd1d9e597d2b) |

Everything degrades to honest local fallbacks with zero credentials — it never fakes a public
blob URL or an on-chain tx. Real user memories are Seal-encrypted and owner-gated; only
redacted metadata (topic + hashes + Walrus ids) is sent to MemWal.

---

## Quick start

**Backend** (npm, port 3001 default):

```bash
cd backend && npm install && npm run dev
```

**Frontend** (pnpm, port 3000):

```bash
cd frontend && pnpm install && pnpm dev
```

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md)
for env vars, routes, and contracts, and [`CLAUDE.md`](CLAUDE.md) for the architecture map.

Public proof, without private keys:

```bash
cd backend && npm run verify:public-proof
```

Live app: [langclaw-sui-walrus.vercel.app](https://langclaw-sui-walrus.vercel.app)
