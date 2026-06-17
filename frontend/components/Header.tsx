import Link from "next/link";
import React from "react";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "./ui/button";
import { LangclawLogo } from "./LangclawLogo";

const navItems = [
  { href: "/chat", label: "Research" },
  { href: "/strategy", label: "Strategy Lab" },
  { href: "/proofs", label: "Proof Center" },
  { href: "/watchlist", label: "Watchlist" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-border/70 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          aria-label="Langclaw home"
          className="flex min-w-0 items-center gap-3"
          href="/"
        >
          <LangclawLogo
            className="size-9 shrink-0 rounded-md ring-1 ring-border/70"
            imageClassName="left-[315%] h-[320px] w-[320px]"
          />
          <span className="min-w-0">
            <span className="block font-semibold text-base leading-5">
              Langclaw
            </span>
            <span className="hidden text-muted-foreground text-xs leading-4 sm:block">
              Sui Alpha
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {navItems.map((item) => (
            <Button asChild key={item.href} size="sm" variant="ghost">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <Button asChild size="sm">
          <Link href="/chat">
            Try Langclaw
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
