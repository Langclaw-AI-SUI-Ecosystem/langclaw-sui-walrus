import Link from "next/link";
import {
  ArrowRightIcon,
  BarChart3Icon,
  BellRingIcon,
  BookOpenCheckIcon,
  CreditCardIcon,
  FlaskConicalIcon,
  MessageSquareTextIcon,
  RadarIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

const capabilities = [
  {
    href: "/chat",
    icon: MessageSquareTextIcon,
    title: "Research",
    label: "core",
    description:
      "Ask for smart-money flow, holder movement, liquidity anomalies, and protocol momentum with source-backed output.",
  },
  {
    href: "/watchlist",
    icon: RadarIcon,
    title: "Alpha Watchlist",
    label: "monitor",
    description:
      "Save signals for follow-up so analysts can return to candidates without re-running context from scratch.",
  },
  {
    href: "/strategy",
    icon: FlaskConicalIcon,
    title: "Strategy Lab",
    label: "test",
    description:
      "Backtest Sui liquidity momentum with Dune-backed rows and paper-trade outcomes.",
  },
  {
    href: "/proofs",
    icon: ShieldCheckIcon,
    title: "Proof Center",
    label: "verify",
    description:
      "Inspect registry decisions and strategy proof records tied to the Langclaw agent identity.",
  },
  {
    href: "/usage",
    icon: CreditCardIcon,
    title: "Usage Ledger",
    label: "account",
    description:
      "Review internal SUI usage balance, billing reservations, and deposit verification surfaces.",
  },
  {
    href: "/task",
    icon: BellRingIcon,
    title: "Automation Monitors",
    label: "follow-up",
    description:
      "Configure monitoring tasks and alert paths for recurring research operations.",
  },
];

const prompts = [
  "Analyze holder flow and smart-money signals on Sui",
  "Detect liquidity anomaly on a Sui DEX pair",
  "Rank Sui protocols by TVL and yield momentum",
];

export default function Capabilities() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 md:px-6 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div className="flex flex-col gap-4">
          <h2 className="text-balance font-semibold text-3xl tracking-normal md:text-5xl">
            Everything on the landing page maps to a real app surface.
          </h2>
          <p className="max-w-2xl text-muted-foreground leading-7">
            No extra claims, no disconnected demo widgets. The UX points users
            into the existing Langclaw routes they can actually open.
          </p>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="mb-4 flex items-center gap-2">
            <BookOpenCheckIcon aria-hidden="true" className="size-4 text-primary" />
            <p className="font-medium text-sm">Demo prompts</p>
          </div>
          <div className="grid gap-2">
            {prompts.map((prompt) => (
              <Link
                className="rounded-md border bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-muted"
                href="/chat"
                key={prompt}
              >
                {prompt}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((item) => {
          const Icon = item.icon;

          return (
            <Card className="rounded-lg shadow-none" key={item.title} size="sm">
              <CardHeader className="gap-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-md bg-muted text-primary">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <Badge variant="outline">{item.label}</Badge>
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-6">
                  {item.description}
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <Link href={item.href}>
                    Open {item.title}
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 rounded-lg border bg-foreground p-6 text-background md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-background/80 text-sm">
            <BarChart3Icon aria-hidden="true" className="size-4" />
            <span>Source-backed alpha workflow</span>
          </div>
          <h2 className="text-balance font-semibold text-2xl md:text-4xl">
            Ready to turn Sui data into proof?
          </h2>
          <p className="max-w-2xl text-background/70 leading-7">
            Start with Research for evidence and source gaps, or open Strategy
            Lab to test a paper-trade thesis.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
          <Button asChild variant="secondary">
            <Link href="/chat">
              Launch Research
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/strategy">Open Strategy Lab</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
