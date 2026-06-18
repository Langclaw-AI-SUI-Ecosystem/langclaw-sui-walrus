import {
  BadgeCheckIcon,
  EyeIcon,
  ExternalLinkIcon,
  FlaskConicalIcon,
  MessageSquareTextIcon,
  RadarIcon,
  ShieldCheckIcon,
} from "lucide-react";
import {
  MAINNET_ARTIFACTS,
  suiObjectUrl,
  suiTxUrl,
} from "@/lib/mainnet-artifacts";

const proofItems: Array<{ href?: string; label: string; value: string }> = [
  { label: "Sui network", value: "mainnet" },
  { label: "Agent ID", value: `#${MAINNET_ARTIFACTS.agentId}` },
  {
    label: "Package",
    value: `${MAINNET_ARTIFACTS.packageId.slice(0, 8)}...${MAINNET_ARTIFACTS.packageId.slice(-6)}`,
    href: suiObjectUrl(MAINNET_ARTIFACTS.packageId),
  },
  {
    label: "Seal key server",
    value: `${MAINNET_ARTIFACTS.keyServerId.slice(0, 8)}...${MAINNET_ARTIFACTS.keyServerId.slice(-6)}`,
    href: suiObjectUrl(MAINNET_ARTIFACTS.keyServerId),
  },
  {
    label: "Memory anchor",
    value: `${MAINNET_ARTIFACTS.memoryTx.slice(0, 8)}...${MAINNET_ARTIFACTS.memoryTx.slice(-6)}`,
    href: suiTxUrl(MAINNET_ARTIFACTS.memoryTx),
  },
];

const pipelineSteps = [
  {
    icon: MessageSquareTextIcon,
    title: "Run one: research",
    text: "The agent produces a source-backed report for the connected Sui wallet.",
  },
  {
    icon: EyeIcon,
    title: "Encrypt with Seal",
    text: "The report is encrypted under an owner-only access policy on Sui mainnet.",
  },
  {
    icon: RadarIcon,
    title: "Store on Walrus",
    text: "The encrypted artifact is written to Walrus and returned with a retrievable blob ID.",
  },
  {
    icon: FlaskConicalIcon,
    title: "Anchor on Sui",
    text: "Langclaw records the content hash and storage reference in a mainnet transaction.",
  },
  {
    icon: BadgeCheckIcon,
    title: "Run two: recall",
    text: "A later run decrypts relevant Walrus memory and uses it as research context.",
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
              One memory loop, fully verifiable.
            </h2>
            <p className="max-w-xl text-muted-foreground leading-7">
              The demo shows two runs from the same wallet. The first stores
              private memory. The second retrieves and reuses it. Every storage
              and proof reference remains inspectable.
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
