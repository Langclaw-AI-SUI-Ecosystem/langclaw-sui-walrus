import Link from "next/link";
import {
  ArrowRightIcon,
  CircleCheckIcon,
  ExternalLinkIcon,
  FileCheck2Icon,
  LockKeyholeIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MAINNET_ARTIFACTS,
  suiObjectUrl,
  suiTxUrl,
} from "@/lib/mainnet-artifacts";

const proofLayerRows: Array<{
  href?: string;
  label: string;
  meta: string;
  value: string;
}> = [
  {
    label: "Langclaw package",
    meta: "Registry, journal, vault, memory modules",
    value: MAINNET_ARTIFACTS.packageId,
    href: suiObjectUrl(MAINNET_ARTIFACTS.packageId),
  },
  {
    label: "LangclawUsageVault",
    meta: "SUI usage vault",
    value: MAINNET_ARTIFACTS.vaultId,
    href: suiObjectUrl(MAINNET_ARTIFACTS.vaultId),
  },
  {
    label: "Langclaw agent ID",
    meta: "Registered agent identity",
    value: MAINNET_ARTIFACTS.agentId,
  },
  {
    label: "Agent owner / recorder",
    meta: "Proof writer wallet",
    value: MAINNET_ARTIFACTS.recorder,
    href: suiObjectUrl(MAINNET_ARTIFACTS.recorder),
  },
];

const deploymentRows: Array<{ href?: string; label: string; value: string }> = [
  {
    label: "Package publish",
    value: MAINNET_ARTIFACTS.packageTx,
    href: suiTxUrl(MAINNET_ARTIFACTS.packageTx),
  },
  {
    label: "Usage vault setup",
    value: MAINNET_ARTIFACTS.vaultTx,
    href: suiTxUrl(MAINNET_ARTIFACTS.vaultTx),
  },
];

const decisionRows: Array<{ href?: string; label: string; signal: string }> = [
  {
    label: "Private memory anchor",
    signal: "mainnet confirmed",
    href: suiTxUrl(MAINNET_ARTIFACTS.decisionTx),
  },
];

export function SquigglyHome() {
  return (
    <section className="border-y bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="max-w-3xl text-balance font-semibold text-3xl tracking-normal md:text-5xl">
              A live Walrus, Seal, and Sui proof layer.
            </h2>
            <p className="max-w-2xl text-muted-foreground leading-7">
              Langclaw encrypts private research with Seal, stores the ciphertext
              on Walrus, and records the content hash through live Sui contracts.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <ProofPillar
              icon={<CircleCheckIcon aria-hidden="true" />}
              title="Evidence first"
              text="Usable rows and source gaps are separated instead of blurred together."
            />
            <ProofPillar
              icon={<FileCheck2Icon aria-hidden="true" />}
              title="Contract backed"
              text="Registry, memory, access policy, and usage vault modules are live on Sui mainnet."
            />
            <ProofPillar
              icon={<LockKeyholeIcon aria-hidden="true" />}
              title="Owner-only recall"
              text="The Seal access policy checks the connected wallet before decryption."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/proofs">
                View Proof Center
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/watchlist">
                Open Watchlist
                <ExternalLinkIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4" id="proof-layer">
          <div className="rounded-lg border bg-background">
            <div className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">Sui mainnet proof layer</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Live package, vault, recorder, and transaction references.
                </p>
              </div>
              <Badge variant="secondary">Sui</Badge>
            </div>
            <Separator />
            <div className="grid">
              {proofLayerRows.map((row) => (
                <ProofLayerRow key={row.label} row={row} />
              ))}
            </div>
            <Separator />
            <div className="grid gap-3 p-4">
              <div>
                <p className="font-medium text-sm">Deployment transactions</p>
                <div className="mt-2 grid gap-2">
                  {deploymentRows.map((row) => (
                    <ProofLinkRow key={row.label} row={row} />
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium text-sm">Live decision examples</p>
                <div className="mt-2 grid gap-2">
                  {decisionRows.map((row) =>
                    row.href ? (
                      <a
                        className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted"
                        href={row.href}
                        key={row.label}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <span className="min-w-0">
                          <span className="font-medium">{row.label}</span>
                          <span className="ml-2 text-muted-foreground">
                            {row.signal}
                          </span>
                        </span>
                        <ExternalLinkIcon
                          aria-hidden="true"
                          className="size-3.5 shrink-0 text-muted-foreground"
                        />
                      </a>
                    ) : (
                      <div
                        className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm"
                        key={row.label}
                      >
                        <span className="min-w-0">
                          <span className="font-medium">{row.label}</span>
                          <span className="ml-2 text-muted-foreground">
                            {row.signal}
                          </span>
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofLayerRow({
  row,
}: {
  row: {
    href?: string;
    label: string;
    meta: string;
    value: string;
  };
}) {
  return (
    <div className="grid gap-2 border-b px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[190px_1fr]">
      <span className="min-w-0">
        <span className="block font-medium">{row.label}</span>
        <span className="block text-muted-foreground text-xs">{row.meta}</span>
      </span>
      {row.href ? (
        <a
          className="inline-flex min-w-0 items-center gap-2 font-mono text-primary text-xs hover:underline"
          href={row.href}
          rel="noreferrer"
          target="_blank"
        >
          <span className="break-all">{row.value}</span>
          <ExternalLinkIcon
            aria-hidden="true"
            className="size-3 shrink-0 text-muted-foreground"
          />
        </a>
      ) : (
        <span className="font-mono text-xs">{row.value}</span>
      )}
    </div>
  );
}

function ProofLinkRow({
  row,
}: {
  row: {
    href?: string;
    label: string;
    value: string;
  };
}) {
  return row.href ? (
    <a
      className="grid gap-1 rounded-md border bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted"
      href={row.href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="font-medium">{row.label}</span>
      <span className="break-all font-mono text-muted-foreground text-xs">
        {row.value}
      </span>
    </a>
  ) : (
    <div className="grid gap-1 rounded-md border bg-muted/20 px-3 py-2 text-sm">
      <span className="font-medium">{row.label}</span>
      <span className="break-all font-mono text-muted-foreground text-xs">
        {row.value}
      </span>
    </div>
  );
}

function ProofPillar({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm leading-6">{text}</p>
    </article>
  );
}
