import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const walletSessionPath = path.join(frontendRoot, "hooks/use-wallet-session.ts");
const web3ProviderPath = path.join(frontendRoot, "lib/Web3Provider.tsx");
const appSidebarPath = path.join(frontendRoot, "components/app-sidebar.tsx");
const chainsPath = path.join(frontendRoot, "lib/chains.ts");
const usageDashboardPath = path.join(
  frontendRoot,
  "components/usage-dashboard.tsx",
);
const adminWithdrawPath = path.join(
  frontendRoot,
  "components/admin-withdraw-dashboard.tsx",
);

test("wallet session signs the backend challenge with the Sui wallet", () => {
  const source = readFileSync(walletSessionPath, "utf8");

  assert.ok(
    source.includes("useSignPersonalMessage"),
    "Expected use-wallet-session.ts to sign with the Sui personal-message hook.",
  );
  assert.ok(
    source.includes("requestWalletChallenge({"),
    "Expected the backend wallet challenge/session flow to be preserved.",
  );
  assert.ok(
    source.includes("createWalletSession("),
    "Expected the session-token exchange to be preserved.",
  );
  assert.ok(
    !/wagmi|rainbow|minipay/i.test(source),
    "Expected use-wallet-session.ts to drop all EVM/MiniPay wallet code.",
  );
});

test("Web3Provider wires the Sui dApp Kit providers", () => {
  const source = readFileSync(web3ProviderPath, "utf8");

  assert.ok(
    source.includes("SuiClientProvider") &&
      source.includes("WalletProvider"),
    "Expected Web3Provider to use the Sui dApp Kit providers.",
  );
  assert.ok(
    !/wagmi|rainbow|WagmiProvider|RainbowKitProvider/i.test(source),
    "Expected Web3Provider to drop Wagmi/RainbowKit.",
  );
});

test("sidebar uses the Sui wallet path and no MiniPay branch", () => {
  const source = readFileSync(appSidebarPath, "utf8");

  assert.ok(
    source.includes("useCurrentAccount") &&
      source.includes("useDisconnectWallet"),
    "Expected the sidebar to read the connected Sui account.",
  );
  assert.ok(
    !/minipay|ConnectButton|wagmi|rainbow/i.test(source),
    "Expected the sidebar to drop MiniPay/RainbowKit wallet UI.",
  );
});

test("chain metadata targets Sui networks", () => {
  const source = readFileSync(chainsPath, "utf8");

  assert.ok(
    source.includes('defaultProductChain: ProductChainId = "sui-mainnet"') &&
      source.includes('productChainOptions = [productChains["sui-mainnet"]]'),
    "Expected chains.ts to expose Sui mainnet as the active product chain.",
  );
  assert.ok(
    !/toWagmiChain|viem|from "viem/.test(source),
    "Expected chains.ts to drop the viem/Wagmi chain mapping.",
  );
});

test("usage top up explains generic wallet execution failures", () => {
  const source = readFileSync(usageDashboardPath, "utf8");

  assert.ok(
    source.includes("useSuiClientQuery") &&
      source.includes("DEPOSIT_GAS_BUFFER_MIST"),
    "Expected the top-up flow to preflight the Sui wallet balance.",
  );
  assert.ok(
    source.includes("unexpected error") &&
      source.includes("Check that your wallet is on"),
    "Expected generic wallet errors to become actionable.",
  );
});

test("admin page withdraws through the Sui usage vault AdminCap", () => {
  const source = readFileSync(adminWithdrawPath, "utf8");

  assert.ok(
    source.includes("::usage_vault::withdraw") &&
      source.includes("AdminCap") &&
      source.includes("getUsageVaultAdminStatus") &&
      source.includes("isAuthorized"),
    "Expected admin withdraw to render only after the backend verifies AdminCap ownership.",
  );
  assert.ok(
    source.includes("tx.pure.u64") && source.includes("tx.pure.address"),
    "Expected withdraw amount and recipient to be encoded as Sui Move args.",
  );
  assert.ok(
    source.includes("verifyUsageVaultWithdrawal") &&
      source.includes("Withdrawal submitted, but audit logging failed"),
    "Expected submitted withdraw txs to be verified and recorded by the backend audit route.",
  );
});
