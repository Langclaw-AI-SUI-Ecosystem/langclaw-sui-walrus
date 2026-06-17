"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSignIcon,
  ClipboardListIcon,
  MessageSquareIcon,
  PanelLeftIcon,
  RadarIcon,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  {
    href: "/chat",
    icon: MessageSquareIcon,
    label: "Chat",
  },
  {
    href: "/usage",
    icon: BadgeDollarSignIcon,
    label: "Credits",
  },
  {
    href: "/watchlist",
    icon: RadarIcon,
    label: "Watch",
  },
  {
    href: "/task",
    icon: ClipboardListIcon,
    label: "Tasks",
  },
];

export function MobileAppNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center gap-1">
        <button
          aria-label="Open menu"
          className="flex min-w-0 flex-1 touch-manipulation flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[11px] leading-none text-muted-foreground"
          onClick={() => setOpenMobile(true)}
          onTouchEnd={() => setOpenMobile(true)}
          type="button"
        >
          <PanelLeftIcon className="size-5" />
          <span className="w-full truncate text-center">Menu</span>
        </button>
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[11px] leading-none text-muted-foreground",
                isActive && "bg-primary/10 text-primary",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="size-5" />
              <span className="w-full truncate text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
