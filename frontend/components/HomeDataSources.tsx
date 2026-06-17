import Link from "next/link";
import {
  ArrowRightIcon,
  BellRingIcon,
  CableIcon,
  DatabaseIcon,
  GaugeIcon,
  HashIcon,
  MessageCircleIcon,
  RadioTowerIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const dataSources = [
  {
    description: "Pair liquidity, price movement, and market context.",
    name: "DEX Screener",
    status: "Public",
  },
  {
    description: "Sui protocol TVL, yield, and momentum context.",
    name: "DeFiLlama",
    status: "Public",
  },
  {
    description: "Historical rows for Strategy Lab and SQL fallback paths.",
    name: "Dune",
    status: "Strategy",
  },
  {
    description: "Sui-scoped smart-money and market research.",
    name: "Surf",
    status: "Premium",
  },
  {
    description: "Smart-money netflow fallback for Sui analysis.",
    name: "Nansen",
    status: "Premium",
  },
  {
    description: "Narrative and sentiment context for research runs.",
    name: "Elfa",
    status: "Premium",
  },
  {
    description: "Trending pools, new pools, token data, and holders.",
    name: "GeckoTerminal / CoinGecko",
    status: "Optional",
  },
  {
    description: "Chain reads, token enrichment, and security checks.",
    name: "Etherscan / Alchemy / GoPlus",
    status: "Optional",
  },
];

const channelCards = [
  {
    action: "Connect in Settings",
    description:
      "Wallet-linked Telegram is the live channel for alpha alerts, automation updates, and the Research access gate.",
    href: "/settings",
    icon: MessageCircleIcon,
    name: "Telegram",
    status: "Live",
  },
  {
    action: "Discord soon",
    description:
      "Discord is listed as the next community alert channel, but the current repo does not ship the webhook integration yet.",
    icon: HashIcon,
    name: "Discord",
    status: "Planned / Next",
  },
];

export function HomeDataSources() {
  return (
    <section className="border-y bg-background" id="data-sources">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <DatabaseIcon aria-hidden="true" className="size-5" />
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="max-w-3xl text-balance font-semibold text-3xl tracking-normal md:text-5xl">
                Sui data sources stay visible from the first page.
              </h2>
              <p className="max-w-2xl text-muted-foreground leading-7">
                Langclaw combines public market feeds, Strategy Lab rows,
                premium Sui intelligence, and optional enrichment. Missing
                coverage is shown as source gaps instead of hidden.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-background">
            <div className="grid border-b bg-muted/30 px-4 py-3 text-muted-foreground text-xs uppercase tracking-normal sm:grid-cols-[1fr_120px]">
              <span>Source</span>
              <span className="hidden sm:block">Mode</span>
            </div>
            <div className="grid">
              {dataSources.map((source) => (
                <div
                  className="grid gap-3 border-b px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_120px] sm:items-center"
                  key={source.name}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{source.name}</p>
                    <p className="mt-1 text-muted-foreground text-sm leading-6">
                      {source.description}
                    </p>
                  </div>
                  <SourceStatusBadge status={source.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm md:grid-cols-3">
            <SourceNote
              icon={<RadioTowerIcon aria-hidden="true" />}
              title="Sui scoped"
              text="Research defaults to Sui mainnet for product-grade signals."
            />
            <SourceNote
              icon={<ShieldAlertIcon aria-hidden="true" />}
              title="Gaps exposed"
              text="Provider misses, disabled keys, and latency are reflected in output."
            />
            <SourceNote
              icon={<GaugeIcon aria-hidden="true" />}
              title="Row aware"
              text="Strategy and liquidity flows prefer row-level evidence when available."
            />
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-lg border bg-foreground p-5 text-background">
            <div className="flex items-center gap-2 text-background/80 text-sm">
              <BellRingIcon aria-hidden="true" className="size-4" />
              <span>Alert channels</span>
            </div>
            <h3 className="mt-3 text-balance font-semibold text-2xl tracking-normal">
              Connect once, receive follow-up signals where your team works.
            </h3>
            <p className="mt-3 text-background/70 text-sm leading-6">
              The app keeps channel state behind wallet auth. Landing CTAs point
              into the existing settings flow instead of creating a separate
              integration path.
            </p>
          </div>

          {channelCards.map((channel) => {
            const Icon = channel.icon;
            const isLive = Boolean(channel.href);

            return (
              <article
                className="rounded-lg border bg-background p-5"
                key={channel.name}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-10 items-center justify-center rounded-md bg-muted text-primary">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <Badge variant={isLive ? "secondary" : "outline"}>
                    {channel.status}
                  </Badge>
                </div>
                <h3 className="mt-5 font-semibold text-xl">{channel.name}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-6">
                  {channel.description}
                </p>
                <div className="mt-5">
                  {channel.href ? (
                    <Button asChild>
                      <Link href={channel.href}>
                        {channel.action}
                        <ArrowRightIcon data-icon="inline-end" />
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled variant="outline">
                      <CableIcon data-icon="inline-start" />
                      {channel.action}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </aside>
      </div>
    </section>
  );
}

function SourceStatusBadge({ status }: { status: string }) {
  if (status === "Premium") {
    return <Badge variant="default">{status}</Badge>;
  }

  if (status === "Strategy") {
    return (
      <Badge className="bg-amber-100 text-amber-900" variant="secondary">
        {status}
      </Badge>
    );
  }

  if (status === "Optional") {
    return <Badge variant="outline">{status}</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
}

function SourceNote({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-primary [&_svg]:size-4">{icon}</span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="mt-1 block text-muted-foreground text-xs leading-5">
          {text}
        </span>
      </span>
    </div>
  );
}
