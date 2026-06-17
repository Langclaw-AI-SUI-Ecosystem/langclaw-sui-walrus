# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Orientation (read this first)

This directory is **Langclaw Sui Alpha** — a Sui-first AI alpha research
agent whose long-term memory lives on **Walrus**. The product/billing/proof layer
runs on **Sui** (`@mysten/sui`, `@mysten/dapp-kit`, a Move package in
`move/langclaw_memory/`, native SUI billing). It was ported from a Celo/EVM
baseline; **Celo and Mantle now survive only as optional EVM *analysis* (research)
chains** in `onchain-tools/chains.ts` — they are no longer product, billing, or
proof chains.

**Walrus is central, not an afterthought.** Every research run is Seal-encrypted,
stored as a Walrus blob, re-fetched and hash-verified, anchored on Sui as a
portable pointer, and indexed for semantic recall via MemWal — this is the
project's submission for the **Sui Walrus Track**. The memory layer
(`src/lib/memory-workflow.ts` + `walrus.ts` / `seal.ts` / `memwal.ts` /
`sui-memory-index.ts`) wraps the research engine; it is *not* optional. For the
judge-facing map and live verification evidence, read `WALRUS_TRACK.md` at the
repo root.

`AGENTS.md` at the repo root is the Codex-facing twin of this file (same
orientation, trimmed). Keep the two roughly in sync when you change shared facts
(ports, package managers, the port gotcha). Note: earlier copy referenced a
broader-project `CLAUDE.md` "one level up" — no such file exists in this
checkout; this `CLAUDE.md` and `AGENTS.md` are the only top-level guides.

This is **not a git repository at this directory level** (the working-dir root
has no `.git`), but `backend/` and `frontend/` are each their own git repo. The
Move sources (`move/langclaw_memory/`) and the `walrus-site/` static bundle live
at the working-dir root, *outside* either git repo — they are tracked manually.

## Two packages

| Package | Stack | Package manager | Dev port |
| --- | --- | --- | --- |
| `backend/` | Plain Node `http` server, TypeScript, ESM | **npm** | 3001 (default) |
| `frontend/` | Next.js 16, React 19, Tailwind v4, shadcn/ui | **pnpm** | 3000 |

> ⚠️ **Lockfile gotcha:** `backend/` is **npm** (`package-lock.json`, all scripts
> are `npm run …`); do **not** `pnpm install` there. `frontend/` is the pnpm
> package (`pnpm-lock.yaml`). Use the right manager in each directory.

> ⚠️ **Port mismatch gotcha:** the backend listens on `3001` by default, but the
> frontend's `next.config.ts` rewrites `/api/backend/*` to
> `LANGCLAW_BACKEND_REWRITE_URL` which defaults to `http://127.0.0.1:3002`. For
> local dev either run the backend with `PORT=3002 npm run dev`, or set
> `LANGCLAW_BACKEND_REWRITE_URL=http://127.0.0.1:3001` in the frontend env.

## Commands

### Backend (`cd backend`, uses npm)

```bash
npm install
npm run dev                # tsx watch src/server.ts -> http://localhost:3001
npm run build              # clean + tsc -p tsconfig.json -> dist/
npm start                  # node dist/server.js (after build)
npm run typecheck          # tsc --noEmit
npm test                   # node --import tsx --test "src/**/*.test.ts"
npm run test:watch
npm run check:sui-proof    # on-chain proof readiness (src/scripts/check-sui-proof-readiness.ts)
npm run check:walrus-readiness  # Walrus/Seal/MemWal config readiness
npm run smoke:memwal       # end-to-end MemWal store->recall smoke (needs .env)
npm run demo:walrus-public # public Walrus store/fetch/verify demo (needs .env)
npm run smoke:deposit-dryrun    # SUI usage-vault deposit dry run
```

Run a single backend test file:

```bash
cd backend && node --import tsx --test src/lib/langclaw/workflow.test.ts
```

The on-chain layer is the Sui Move package at the **working-dir root**
`move/langclaw_memory/` (sibling to `backend/`, *not* under it). It bundles five
modules, each backing a backend subsystem: `memory_registry` (Walrus pointer
anchor), `access_policy` (Seal access control), `usage_vault` (native-SUI
billing), `decision_registry` (proof events), `trading_journal` (Strategy Lab).
Publish/upgrade with `sui client publish|upgrade` and paste the resulting ids
into `SUI_*` env vars (see `backend/README.md` "Current Sui Verification"). The
`backend/scripts/*.mjs` `deploy:*` helpers and `dune:create-strategy-query` /
`smoke:strategy-lab` are retained ops tooling. `walrus-site/` is a static
judge-facing site bundle for publishing to Walrus Sites (see its `PUBLISH.md`).

### Frontend (`cd frontend`, uses pnpm)

```bash
pnpm install
pnpm dev                   # next dev -> http://localhost:3000
pnpm build                 # next build
pnpm typecheck             # tsc --noEmit --pretty false
pnpm lint                  # eslint

# fastest regression net for wallet/env behavior:
node --test tests/sui-wallet.test.mjs
```

Frontend tests are standalone `node:test` `.mjs` files in `frontend/tests/`
(not part of a test runner script) — run them directly with `node --test`.

## Backend architecture

Plain Node `http` server (no framework). `src/server.ts` does manual routing +
CORS and converts `IncomingMessage` <-> web `Request`/`Response`. All routes are
`POST` (except `GET /health`) and registered in one `Map` in `server.ts`. Routes
in `src/routes/` are thin; all logic lives in `src/lib/`. ESM throughout with
**extensionless** intra-package imports (`./hash`, not `./hash.js`).

### The research workflow (the core)

`POST /api/discover` (and `/api/discover/stream`, `/api/chat/stream`) call
`src/lib/memory-workflow.ts` `runPrivateMemoryWorkflow(...)` — the Sui+Walrus
memory layer — which recalls prior memory, then runs
`src/lib/langclaw/workflow.ts` `runLangclawWorkflow(topic)` with that context
injected, then Seal-encrypts + stores the result on Walrus and anchors a pointer
on Sui (see "Private memory workflow" below). The route wraps all of this with:
account auth → required Telegram link → **usage reservation** → run →
**usage settle/refund** (`src/lib/usage.ts`). This is a single engine — there is
no legacy/alternate engine switch in this codebase.

`runLangclawWorkflow` is an OpenClaw-style staged agent pipeline:

```
planner -> discovery -> source-normalizer -> trend-scorer
        -> evidence-packager -> verifier -> final-conclusion
```

- It runs on a **built-in TypeScript OpenClaw-compatible runtime**
  (`langclaw/openclaw-workflow.ts`) and only shells out to an external `openclaw`
  CLI when `OPENCLAW_ENABLED=true` (`langclaw/openclaw-runner.ts`).
- Agent prompts/skills are markdown in `backend/openclaw/skills/*.md`, loaded at
  runtime from `process.cwd()` — **run backend scripts from the `backend/`
  directory** so these paths resolve.
- Final-answer synthesis: OpenAI (`langclaw/openai-synthesis.ts`) → OpenClaw AI
  (`langclaw/openclaw-ai.ts`) → deterministic template, in that fallback order.
  Guardrails in `langclaw/final-answer-guardrails.ts`; quality scoring in
  `langclaw/alpha-quality.ts`; UI render object built in `langclaw/report.ts`.

### Data layer: `src/lib/onchain-tools/`

The premium on-chain/market data layer used by the workflow:
`planner.ts` → `executor.ts` → `synthesizer.ts`, with a route table in
`registry.ts` and per-provider adapters in `onchain-tools/providers/` (Alchemy,
Dune, Etherscan, Nansen, GoPlus, Elfa, Surf, DeFiLlama, DEX Screener,
GeckoTerminal, CoinGecko). `providers/http.ts` is the shared fetch wrapper that
redacts API keys. Provider responses normalize to source cards;
`onchain-tools/chains.ts` infers/validates the analysis chain and refuses
unsupported chains honestly.

### Other backend subsystems

- **Auth** (`src/lib/server/`): `wallet-auth.ts` (sign-in challenge/session),
  `api-keys.ts` (hashed with `LANGCLAW_API_KEY_PEPPER`), `account-auth.ts`
  (resolves wallet session **or** API key, enforces the Telegram-link gate).
  Auth failures throw `AccountAuthError` / `WalletAuthError`; routes translate
  them to 401.
- **Usage billing** (`src/lib/usage.ts`, `usage-pricing.ts`): internal
  ledger-based credits backed by native **SUI** deposits into the `usage_vault`
  Move module (shared `Vault` object). Research/chat runs reserve before work and
  settle/refund after.
- **Strategy Lab** (`src/lib/strategy/`): Dune-backed backtest / paper-trade,
  results anchored via `LangclawTradingJournal`. Backtesting only — no live
  trading.
- **Automation** (`src/lib/automation/`): scheduled tasks, runs, in-app +
  Telegram notifications, inbound webhooks (`/api/automation/webhooks/:slug`).
- **Chat** (`routes/chat-stream.ts`, `lib/openai-direct-chat.ts`): streaming
  direct-LLM chat, separate from the research workflow.
- **Proofs** (`src/lib/langclaw/proof.ts`, `proof-readiness.ts`): records agent
  decisions on-chain by emitting `DecisionRecorded` events from the
  `decision_registry` Move module (via `src/lib/sui-onchain.ts`) when proof env is
  configured. `routes/proofs.ts` reads them back with `queryEvents`.
- **Persistence**: Supabase (`src/lib/supabase/`), schema in
  `backend/supabase/migrations/`. `database.types.ts` is the generated types.

### Chain config

`src/lib/chain-config.ts` defines the product chains: **`sui-testnet` (default)**
and `sui-mainnet`. Env vars are prefixed `SUI_*` and read via
`readChainEnv(chain, suffix)`. Billing currency is native **SUI** (9 decimals,
MIST). Separately, `onchain-tools/chains.ts` lists the *analysis* chains the agent
can research — Sui plus EVM chains (ethereum, base, arbitrum, …, celo, mantle);
those are research targets only, not product chains.

### Adapter / local-fallback pattern (important)

Every external integration degrades gracefully. Without `OPENAI_API_KEY` the
agents fall back to deterministic template output; without provider keys the
workflow reports honest **source gaps** rather than fabricating data; without
proof/journal env the proof state is reported as `prepared`/not-configured. Heavy
SDKs (`@mysten/sui`, `@supabase/supabase-js`, and `viem` — still used for
keccak256 hashing) are `await import()`-ed lazily in the code path that needs
them. When adding an integration, follow the existing shape: a
factory that branches on env config plus a status function that feeds readiness.

### On-chain verification values

The deployed Sui testnet artifacts (package id, shared `Vault` object id, agent
id, tx digests) are documented in `backend/README.md` "Current Sui Verification"
and `backend/docs/SUI_ELIGIBILITY.md`. Keep those two in sync when you redeploy or
upgrade the Move package.

## Frontend architecture

Next.js 16 App Router. **This is not the Next.js in your training data** — read
the relevant guide under `frontend/node_modules/next/dist/docs/` before changing
Next.js code (see `frontend/AGENTS.md`). User pages live under
`app/(user)/` (`/chat`, `/usage`, `/watchlist`, `/strategy`, `/proofs`,
`/settings`, `/key`, `/memory`, `/task`, `/admin`).

- **Wallet/web3** (Sui): `lib/Web3Provider.tsx` (`@mysten/dapp-kit` +
  `@mysten/sui`), `hooks/use-wallet-session.ts`, `WalletSessionAutoSign.tsx` —
  Sui wallet connection + personal-message sign-in. No EVM/Wagmi/RainbowKit/MiniPay.
- **Backend access**: all API calls go through the Next rewrite
  `/api/backend/*` → `LANGCLAW_BACKEND_REWRITE_URL` (see port gotcha above).
  Client helpers in `lib/langclaw-api.ts` and `lib/langclaw-chat-transport.ts`.
- **Model contract**: chat requests are hard-locked to `gpt-5.4-nano` via
  `lib/chat-model.ts` (`resolveChatModel()`). Do **not** add a second model
  selector unless intentionally changing the product contract.
- **Honesty rule**: do not fabricate sample provider data on live Sui surfaces.
  If the backend returns gaps or provider failures, render them honestly.

## Config

Backend: copy `backend/.env.example` → `backend/.env`. Useful minimum is
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, `LANGCLAW_API_KEY_PEPPER`,
`LANGCLAW_WALLET_SESSION_SECRET`, `OPENAI_API_KEY`, and
`CORS_ORIGIN=http://localhost:3000`. Core Sui vars (`SUI_CHAIN_*`,
`SUI_LANGCLAW_*`) and provider keys are documented in `backend/README.md`.
Everything runs offline with no keys via the local fallbacks above.

Frontend: copy `frontend/.env.example` → `frontend/.env.local`. Key vars:
`NEXT_PUBLIC_LANGCLAW_API_URL` (default `/api/backend`),
`LANGCLAW_BACKEND_REWRITE_URL`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.

## Conventions

- ESM (`"type": "module"`); extensionless intra-package imports.
- Tests are colocated `*.test.ts` (backend) using `node:test`; frontend tests are
  `tests/*.test.mjs` run directly with `node --test`.
- Routes return web `Response` objects; auth errors throw typed errors that
  routes translate to HTTP status codes.
- Analysis-first product scope: no live-funds trading is ever executed.

## Reference docs

`backend/README.md` (routes, env, contracts, verification table),
`backend/LANGCLAW_BLUEPRINT.md` (product positioning, demo prompts, output
shape), `backend/docs/API_REFERENCE.md` (request/response shapes),
`backend/docs/SUI_ELIGIBILITY.md`, `frontend/README.md`.
