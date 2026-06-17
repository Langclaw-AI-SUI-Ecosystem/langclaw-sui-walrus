/// Native-SUI usage deposit vault for the internal credit ledger.
///
/// Mirrors the EVM `LangclawUsageVault` (deposit + withdraw, Deposit/Withdrawal
/// events). This is the one module in the package that must hold state: a shared
/// `Vault` object holds the pooled `Balance<SUI>`, and an `AdminCap` gates
/// withdrawals (operator payout). A metadata `Deposited` event is emitted so the
/// backend can credit the off-chain Supabase credit ledger after verifying the
/// on-chain deposit. Billing currency is native SUI (9 decimals), so there is no
/// ERC-20 token-deposit variant — `deposit` always takes `Coin<SUI>`.
module langclaw_memory::usage_vault {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::sui::SUI;

    /// Requested withdrawal exceeds the vault balance.
    const EInsufficientBalance: u64 = 0;

    /// Shared object that pools all usage deposits. Created and shared once in
    /// `init`. `admin` records the publisher for transparency; withdrawals are
    /// authorized by holding the `AdminCap`, not by `admin` equality.
    public struct Vault has key {
        id: UID,
        balance: Balance<SUI>,
        admin: address,
    }

    /// Capability minted to the publisher on `init`. Required to call `withdraw`.
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Emitted on every deposit. The backend reads this event (by tx digest) to
    /// credit the off-chain ledger: `payer` must equal the authenticated wallet,
    /// `amount` is in MIST (1e-9 SUI), `deposit_reference` echoes the client
    /// reference (empty when none).
    public struct Deposited has copy, drop {
        payer: address,
        amount: u64,
        deposit_reference: vector<u8>,
        balance_after: u64,
    }

    /// Emitted on every admin withdrawal (operator payout).
    public struct Withdrawn has copy, drop {
        admin: address,
        recipient: address,
        amount: u64,
        balance_after: u64,
    }

    /// Deposit native SUI into the shared vault. The Sui replacement for the EVM
    /// `deposit()` payable. Argument order (vault object first, then pure args)
    /// matches `buildMoveArguments` in `backend/src/lib/sui-onchain.ts`.
    public fun deposit(
        vault: &mut Vault,
        payment: Coin<SUI>,
        deposit_reference: vector<u8>,
        ctx: &TxContext,
    ) {
        let amount = coin::value(&payment);
        balance::join(&mut vault.balance, coin::into_balance(payment));

        event::emit(Deposited {
            payer: ctx.sender(),
            amount,
            deposit_reference,
            balance_after: balance::value(&vault.balance),
        });
    }

    /// Admin-only payout from the vault. Mirrors the EVM owner-gated withdraw.
    public fun withdraw(
        _cap: &AdminCap,
        vault: &mut Vault,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        assert!(balance::value(&vault.balance) >= amount, EInsufficientBalance);

        let payout = coin::take(&mut vault.balance, amount, ctx);
        transfer::public_transfer(payout, recipient);

        event::emit(Withdrawn {
            admin: ctx.sender(),
            recipient,
            amount,
            balance_after: balance::value(&vault.balance),
        });
    }

    /// Post-upgrade bootstrap: creates and shares a new Vault, transferring the
    /// AdminCap to the caller. Call once after a package upgrade (init does not
    /// re-run on upgrade). On testnet only the deployer should call this.
    public entry fun create_vault(ctx: &mut TxContext) {
        let vault = Vault {
            id: object::new(ctx),
            balance: balance::zero<SUI>(),
            admin: ctx.sender(),
        };
        transfer::share_object(vault);

        let cap = AdminCap { id: object::new(ctx) };
        transfer::public_transfer(cap, ctx.sender());
    }

    /// Read-only helper: current pooled balance (MIST).
    public fun balance(vault: &Vault): u64 {
        balance::value(&vault.balance)
    }
}
