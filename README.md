# Langclaw Sui Walrus

This repository is now an index for the split Langclaw Sui Walrus codebase.

Active code lives in three public repositories:

| Repository | Purpose |
| --- | --- |
| [backend](https://github.com/Langclaw-AI-SUI-Ecosystem/backend) | Node.js API, agent runtime, Walrus, Seal, MemWal, Sui proof scripts |
| [frontend](https://github.com/Langclaw-AI-SUI-Ecosystem/frontend) | Next.js app, Sui wallet UI, Proof Center, Walrus Site source |
| [move](https://github.com/Langclaw-AI-SUI-Ecosystem/move) | Sui Move package for memory registry, access policy, usage vault, decision registry, and trading journal |

Live app:

<https://langclaw-sui-walrus.vercel.app>

## Current status

- The old monorepo layout has been retired.
- `backend/`, `frontend/`, `move/`, and `walrus-site/` are no longer maintained here.
- Use the repositories above for issues, code review, CI, deployment, and future changes.

## Mainnet proof summary

Langclaw stores encrypted AI memory on Walrus, enforces owner-only recall with
Seal, and records metadata proofs on Sui mainnet.

Key public artifacts:

| Item | Value |
| --- | --- |
| Sui network | `mainnet` |
| Langclaw package | `0x7f3578ebe174b0343cd96391b2a1c75d5db4ad82c793650b3950bdb5634192e5` |
| Usage Vault | `0x816064d45dfe06194a973bce4b38a137365bbd6979c61b0d09435b7a443f3eff` |
| Recorder | `0x4b635af81752a2bcdaeb908bd522173ad1c86a859a9c56ee59d3089c35e0a622` |
| Seal KeyServer | `0x86b608dcb3fcb9c629cfe6d865681977d1decb219a2eb98eb6058b87377feaf3` |
| Walrus Site object | `0x423a0cf7bfa109ed48ae6fae63eead7b7eae751b0885925b137bfd1d9e597d2b` |

Verification commands are in the [backend](https://github.com/Langclaw-AI-SUI-Ecosystem/backend)
and [move](https://github.com/Langclaw-AI-SUI-Ecosystem/move) repositories.
