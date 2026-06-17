# Langclaw Frontend

Next.js interface for **Langclaw Sui Alpha**, with wallet
auth, Sui Intelligence, SUI usage credits, Strategy Lab, Alpha Watchlist, and
Proof Center.

## User-Facing Areas

| Area | Purpose |
| --- | --- |
| Chat / Sui Intelligence | Sui smart-money, liquidity anomaly, protocol momentum, and holder-flow prompts |
| Alpha Watchlist | Saved Sui intelligence signals for follow-up review |
| Usage | Sui SUI credits, vault info, deposit verification, and withdrawal request flow |
| Strategy Lab | Sui pair scan, Dune-backed backtest, equity curve, trade table, and paper-trade proof |
| Proof Center | Sui `decision_registry` decisions and `trading_journal` strategy records |
| Settings / Automation | Telegram linking, notification settings, and scheduled monitor configuration |
| API Keys / Memory | Wallet-scoped API key management and memory controls |

The app is analysis-first. It does not execute live-funds trades.

## Local Setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

The frontend talks to the backend through `NEXT_PUBLIC_LANGCLAW_API_URL`.
Default frontend env:

```bash
NEXT_PUBLIC_LANGCLAW_API_URL=/api/backend
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
LANGCLAW_BACKEND_REWRITE_URL=http://127.0.0.1:3002
```

If the backend is running with its package default (`npm run dev`, port `3001`),
set:

```bash
LANGCLAW_BACKEND_REWRITE_URL=http://127.0.0.1:3001
```

On Vercel, `LANGCLAW_BACKEND_REWRITE_URL` must be a public Sui backend URL or a
domain that proxies to the VPS backend. Do not point a deployed HTTPS frontend
at a private localhost or plain HTTP-only backend.

## Model Contract

The frontend hard-locks chat requests to:

```text
gpt-5.4-nano
```

Source: [`lib/chat-model.ts`](lib/chat-model.ts).

The backend may still use `OPENAI_CHAT_MODEL` and `OPENAI_AGENT_MODEL` defaults
when no requested model is supplied. Frontend create/send/retry paths should use
`resolveChatModel()` rather than adding a second model selector.

## Demo Flow

Use Sui Intelligence mode with:

```text
Find smart-money accumulation on Sui
```

Then:

```text
Detect liquidity anomalies on Sui DEX pairs
```

Then:

```text
Rank Sui protocols by TVL and yield momentum
```

Expected output:

- Source-backed signal summary.
- Risk notes and false-positive checks.
- Provider evidence and source gaps.
- `report` rendering with cards or tables when data exists.
- `Agent decision proof` panel when backend proof anchoring is configured.

Click **Add to watchlist** on a Sui Intelligence result, then open
`/watchlist` to review saved signals. Open `/strategy` to run the Dune-backed
Sui Liquidity Momentum Strategy, review equity curve/trades, and open a paper
trade proof. Open `/proofs` to inspect latest registry decisions and Strategy
Proofs for the Sui agent.

## Wallet And Chain Behavior

- Default product chain is Sui mainnet.
- Sui billing currency is SUI.

Research requests require a connected wallet and linked Telegram account. If the
wallet session is missing, the UI should ask the user to connect/sign. If
Telegram is missing, the Telegram connect dialog should handle the link flow.

## Usage Credits

Sui Intelligence requests reserve and settle the user's internal usage balance
through the backend billing ledger. SUI-backed credits on Sui mainnet are the
default.

Usage flow:

1. User connects wallet.
2. Usage page loads balance, quote, and vault info.
3. User deposits SUI into the `usage_vault` shared object.
4. Frontend waits for the transaction and submits deposit verification.
5. Backend credits the internal usage ledger.
6. Research requests reserve/settle internal balance.
7. Withdraw request returns backend authorization before user calls vault
   withdrawal.

## Live Proof Contracts

Configured for Sui mainnet (`decision_registry`, `trading_journal`,
`usage_vault`, and `memory_registry` modules ship in one Move package).

| Artifact | Value |
| --- | --- |
| Package ID (registry + journal) | [`0x7f3578ebe174b0343cd96391b2a1c75d5db4ad82c793650b3950bdb5634192e5`](https://suivision.xyz/package/0x7f3578ebe174b0343cd96391b2a1c75d5db4ad82c793650b3950bdb5634192e5) |
| Usage Vault shared object | [`0x816064d45dfe06194a973bce4b38a137365bbd6979c61b0d09435b7a443f3eff`](https://suivision.xyz/object/0x816064d45dfe06194a973bce4b38a137365bbd6979c61b0d09435b7a443f3eff) |
| AdminCap object | [`0x21314b9534ca673cac1c79d6d1a63b9b0469d684504c974d3e8a5588873e8d09`](https://suivision.xyz/object/0x21314b9534ca673cac1c79d6d1a63b9b0469d684504c974d3e8a5588873e8d09) |

Sui agent identity:

| Item | Value |
| --- | --- |
| Agent ID | `133` |
| Agent owner / recorder | [`0x4b635af81752a2bcdaeb908bd522173ad1c86a859a9c56ee59d3089c35e0a622`](https://suivision.xyz/account/0x4b635af81752a2bcdaeb908bd522173ad1c86a859a9c56ee59d3089c35e0a622) |

Deployment proof transactions:

```text
Package publish: 6kmuA94JsgM7uJ7MN32WEbWFMkF5rBuLUrUwFT4eTKED
Vault setup:     ALvypw6EvadDXo4MCzgNEPgLJ8jES3rVLsWZHCnnqYVH
Agent:           133
```

Strategy Lab journal proofs are configured against the mainnet backend
deployment once `SUI_LANGCLAW_TRADING_JOURNAL_PACKAGE_ID` is set.
Local clones without `SUI_LANGCLAW_TRADING_JOURNAL_PACKAGE_ID` still run
backtests, but Proof Center should honestly show the journal as not configured.

## Important Routes

| Route | Surface |
| --- | --- |
| `/` | Home / launch surface |
| `/chat` | Chat and Sui Intelligence |
| `/usage` | Usage balance, deposits, withdrawals |
| `/watchlist` | Alpha Watchlist |
| `/strategy` | Strategy Lab |
| `/proofs` | Proof Center |
| `/settings` | Automation and notification settings |
| `/key` | API key management |
| `/memory` | Memory controls |
| `/task` | Automation task surface |

## Development Notes

- This project uses Next.js `16.2.6`, React `19.2.4`, and Sui dApp Kit.
- Read [`AGENTS.md`](AGENTS.md) before changing Next.js code.
- Keep Sui-specific labels visible where they are source-of-truth: chain badge,
  usage billing, and proof records.
- Do not add a second frontend model selector unless the product contract is
  changed intentionally.
- Frontend should not fabricate sample provider data on live Sui surfaces. If
  backend returns gaps or provider failures, render them honestly.

## Verification

```bash
node --test tests/sui-wallet.test.mjs
pnpm typecheck
pnpm build
```

Use the Sui wallet test as the quickest regression net for wallet
session and sidebar-connect behavior before broader UI checks.

For rendered UI changes, also run the app and check the affected pages in a
browser:

```bash
pnpm dev
```
