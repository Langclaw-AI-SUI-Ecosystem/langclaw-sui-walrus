import {
  BadgeCheckIcon,
  EyeIcon,
  ExternalLinkIcon,
  FlaskConicalIcon,
  MessageSquareTextIcon,
  RadarIcon,
  ShieldCheckIcon,
} from "lucide-react";

const proofItems: Array<{ href?: string; label: string; value: string }> = [
  { label: "Sui network", value: "mainnet" },
  { label: "Agent ID", value: "#133" },
  {
    label: "Package",
    value: "Set in env",
  },
  {
    label: "UsageVault",
    value: "Set in env",
  },
  {
    label: "Vault setup tx",
    value: "Required",
  },
];

const pipelineSteps = [
  {
    icon: MessageSquareTextIcon,
    title: "Ask in Research",
    text: "Run smart-money, holder-flow, liquidity anomaly, and protocol momentum prompts.",
  },
  {
    icon: EyeIcon,
    title: "Inspect evidence",
    text: "Separate usable evidence from source gaps so weak provider coverage stays visible.",
  },
  {
    icon: RadarIcon,
    title: "Track signals",
    text: "Save alpha candidates to Watchlist for follow-up monitoring and review.",
  },
  {
    icon: FlaskConicalIcon,
    title: "Test strategy",
    text: "Use Strategy Lab to backtest Sui pair momentum before any real execution path.",
  },
  {
    icon: BadgeCheckIcon,
    title: "Publish proof",
    text: "Record deterministic outcomes through the proof layer when the backend is configured.",
  },
];

export default function HomeDemoLaunchpad() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-10 md:px-6 md:py-16">
      <div className="grid overflow-hidden rounded-lg border bg-background sm:grid-cols-2 lg:grid-cols-5">
        {proofItems.map((item) => (
          <div
            className="border-b p-5 sm:border-r lg:border-b-0"
            key={item.label}
          >
            <p className="font-mono text-muted-foreground text-xs uppercase">
              {item.label}
            </p>
            {item.href ? (
              <a
                className="mt-2 inline-flex min-w-0 items-center gap-2 font-semibold text-lg text-primary hover:underline"
                href={item.href}
                rel="noreferrer"
                target="_blank"
              >
                <span className="truncate">{item.value}</span>
                <ExternalLinkIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </a>
            ) : (
              <p className="mt-2 font-semibold text-lg">{item.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheckIcon aria-hidden="true" className="size-5" />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-balance font-semibold text-3xl tracking-normal md:text-5xl">
              A clean pipeline from research to proof.
            </h2>
            <p className="max-w-xl text-muted-foreground leading-7">
              Langclaw keeps the user journey direct: ask a research question,
              inspect the evidence, track the signal, test the strategy, then
              anchor the decision when proof writing is available.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-[56px_1fr]"
                key={step.title}
              >
                <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <span className="font-mono text-muted-foreground text-xs">
                    0{index + 1}
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-md bg-muted text-primary">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-6">
                    {step.text}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
