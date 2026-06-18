import Link from "next/link";
import {
  ArrowRightIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  DatabaseIcon,
  ExternalLinkIcon,
  SearchIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  MAINNET_ARTIFACTS,
  suiObjectUrl,
  suiTxUrl,
  walrusBlobUrl,
} from "@/lib/mainnet-artifacts";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";

const evidenceRows = [
  {
    title: "Walrus storage",
    value: "Encrypted memory blob is publicly retrievable",
    status: "verified",
  },
  {
    title: "Seal privacy",
    value: "Owner-gated mainnet key server round-trip",
    status: "verified",
  },
  {
    title: "Sui proof",
    value: "Memory hash anchored in a mainnet transaction",
    status: "verified",
  },
];

const identityChips: Array<{ href?: string; label: string; value: string }> = [
  { label: "Walrus network", value: "mainnet" },
  {
    label: "Package ID",
    value: `${MAINNET_ARTIFACTS.packageId.slice(0, 8)}...${MAINNET_ARTIFACTS.packageId.slice(-6)}`,
    href: suiObjectUrl(MAINNET_ARTIFACTS.packageId),
  },
  {
    label: "Proof transaction",
    value: `${MAINNET_ARTIFACTS.memoryTx.slice(0, 8)}...${MAINNET_ARTIFACTS.memoryTx.slice(-6)}`,
    href: suiTxUrl(MAINNET_ARTIFACTS.memoryTx),
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_72%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_72%,transparent)_1px,transparent_1px)] bg-[size:56px_56px] opacity-35" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            <h1 className="max-w-3xl text-balance font-semibold text-4xl tracking-normal md:text-5xl md:leading-[1.04]">
              Private AI memory on Walrus, verified on Sui.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground leading-7 md:text-lg">
              Langclaw recalls prior research, encrypts new memory with Seal,
              stores it on Walrus, and anchors its hash on Sui mainnet.
            </p>
          </div>

          <form action="/chat" className="max-w-2xl" method="get">
            <InputGroup className="min-h-14 rounded-lg bg-background shadow-sm">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Research prompt"
                className="h-14 text-base"
                name="q"
                placeholder="Research Sui liquidity and remember the findings..."
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="sm" type="submit" variant="default">
                  Research
                  <ArrowRightIcon data-icon="inline-end" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/chat">
                Run private research
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/strategy">
                <BarChart3Icon data-icon="inline-start" />
                Strategy Lab
              </Link>
            </Button>
          </div>

          <div className="grid max-w-2xl gap-2 sm:grid-cols-3">
            {identityChips.map((item) => {
              const content = (
                <>
                  <span className="block font-mono text-muted-foreground text-[11px] uppercase">
                    {item.label}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 font-semibold">
                    {item.value}
                    {item.href ? (
                      <ExternalLinkIcon
                        aria-hidden="true"
                        className="size-3.5 text-muted-foreground"
                      />
                    ) : null}
                  </span>
                </>
              );

              return item.href ? (
                <a
                  className="rounded-md border bg-background/85 px-3 py-2 text-sm shadow-sm transition-colors hover:bg-background"
                  href={item.href}
                  key={item.label}
                  rel="noreferrer"
                  target="_blank"
                >
                  {content}
                </a>
              ) : (
                <div
                  className="rounded-md border bg-background/85 px-3 py-2 text-sm shadow-sm"
                  key={item.label}
                >
                  {content}
                </div>
              );
            })}
          </div>

        </div>

        <ResearchPreview />
      </div>
    </section>
  );
}

function ResearchPreview() {
  return (
    <div className="rounded-lg border bg-background shadow-xl shadow-primary/5">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          <span className="font-medium text-sm">Verifiable Memory Console</span>
        </div>
        <Badge variant="outline">Sui mainnet</Badge>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-3 p-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Private research memory</p>
                <p className="text-muted-foreground text-sm">
                  Research output is encrypted before it reaches Walrus.
                </p>
              </div>
              <Badge variant="secondary">
                <CheckCircle2Icon data-icon="inline-start" />
                mainnet verified
              </Badge>
            </div>
          </div>

          <div className="grid gap-3">
            {evidenceRows.map((row) => (
              <div
                className="grid gap-3 rounded-lg border bg-background p-3 text-sm sm:grid-cols-[1fr_auto]"
                key={row.title}
              >
                <div className="min-w-0">
                  <p className="font-medium">{row.title}</p>
                  <p className="truncate text-muted-foreground">{row.value}</p>
                </div>
                <EvidenceBadge status={row.status} />
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">Public proof artifact</p>
                <p className="text-muted-foreground text-xs">
                  Inspect the blob without trusting this interface
                </p>
              </div>
              <a
                className="inline-flex items-center gap-1 font-mono text-primary text-xs hover:underline"
                href={walrusBlobUrl(MAINNET_ARTIFACTS.publicBlobId)}
                rel="noreferrer"
                target="_blank"
              >
                Open blob <ExternalLinkIcon className="size-3" />
              </a>
            </div>
            <code className="block break-all rounded-md bg-muted p-3 text-xs">
              {MAINNET_ARTIFACTS.publicBlobId}
            </code>
          </div>
        </div>

        <aside className="border-t bg-muted/40 p-4 lg:border-t-0 lg:border-l">
          <div className="flex flex-col gap-4">
            <ConsoleSideItem
              icon={<ShieldCheckIcon aria-hidden="true" />}
              label="Proof status"
              value="Sui mainnet anchor confirmed"
            />
            <ConsoleSideItem
              icon={<DatabaseIcon aria-hidden="true" />}
              label="Evidence"
              value="Walrus blob and content hash"
            />
            <ConsoleSideItem
              icon={<TriangleAlertIcon aria-hidden="true" />}
              label="Privacy"
              value="Seal owner policy enforced"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function EvidenceBadge({ status }: { status: string }) {
  if (status === "gap") {
    return (
      <Badge className="bg-amber-100 text-amber-900" variant="secondary">
        source gap
      </Badge>
    );
  }

  if (status === "review") {
    return <Badge variant="outline">review</Badge>;
  }

  return <Badge variant="secondary">verified</Badge>;
}

function ConsoleSideItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="mt-0.5 text-primary [&_svg]:size-4">{icon}</span>
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span className="block text-muted-foreground text-xs leading-5">
          {value}
        </span>
      </span>
    </div>
  );
}
