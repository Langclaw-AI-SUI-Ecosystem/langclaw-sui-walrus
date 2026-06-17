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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";

const evidenceRows = [
  {
    title: "Smart-money flow",
    value: "+18.4% net accumulation",
    status: "verified",
  },
  {
    title: "Liquidity anomaly",
    value: "2.7x baseline volume",
    status: "review",
  },
  {
    title: "Source gaps",
    value: "Nansen fallback unavailable",
    status: "gap",
  },
];

const identityChips: Array<{ href?: string; label: string; value: string }> = [
  { label: "Sui network", value: "mainnet" },
  {
    label: "Package ID",
    value: "Set in env",
  },
  {
    label: "Agent ID",
    value: "#133",
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
              Sui intelligence for source-backed alpha decisions.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground leading-7 md:text-lg">
              Analyze smart-money flow, liquidity anomalies, protocol momentum,
              Strategy Lab backtests, and on-chain proof records from one
              wallet-authenticated workspace.
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
                placeholder="Detect liquidity anomaly on a Sui pair..."
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
                Open Research
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
          <span className="font-medium text-sm">Research Intelligence Console</span>
        </div>
        <Badge variant="outline">Sui mainnet</Badge>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-3 p-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Liquidity anomaly brief</p>
                <p className="text-muted-foreground text-sm">
                  Pair activity is above local baseline with partial provider
                  coverage.
                </p>
              </div>
              <Badge variant="secondary">
                <CheckCircle2Icon data-icon="inline-start" />
                source-backed
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
                <p className="font-medium text-sm">Sui liquidity trend</p>
                <p className="text-muted-foreground text-xs">
                  Indexed 24h movement
                </p>
              </div>
              <span className="font-mono text-primary text-xs">+27.8%</span>
            </div>
            <svg
              aria-label="Liquidity trend preview"
              className="h-24 w-full"
              role="img"
              viewBox="0 0 520 128"
            >
              <path
                d="M0 96 C70 84 92 100 136 76 C184 50 220 62 262 48 C314 30 350 48 388 28 C432 4 470 18 520 10"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="4"
                className="text-primary"
              />
              <path
                d="M0 118 C80 112 122 105 170 94 C238 79 292 70 350 58 C422 42 474 35 520 30"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                className="text-muted-foreground/35"
              />
            </svg>
          </div>
        </div>

        <aside className="border-t bg-muted/40 p-4 lg:border-t-0 lg:border-l">
          <div className="flex flex-col gap-4">
            <ConsoleSideItem
              icon={<ShieldCheckIcon aria-hidden="true" />}
              label="Proof status"
              value="Decision hash ready"
            />
            <ConsoleSideItem
              icon={<DatabaseIcon aria-hidden="true" />}
              label="Evidence"
              value="DEX rows, TVL, yield context"
            />
            <ConsoleSideItem
              icon={<TriangleAlertIcon aria-hidden="true" />}
              label="Source gaps"
              value="Shown instead of hidden"
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
