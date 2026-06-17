"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function UserLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isChatSession = pathname?.startsWith("/chat/") ?? false;

  return (
    <SidebarProvider>
      <AppSidebar />
      <main
        className={cn(
          "w-full min-w-0 flex-1 basis-0 max-w-[100vw] overflow-x-hidden",
          isChatSession
            ? "relative h-[100dvh] max-w-none overflow-hidden p-0"
            : "mx-auto px-4 py-8 md:max-w-6xl md:px-6",
        )}
      >
        <SidebarTrigger
          className={cn(
            "md:hidden",
            isChatSession
              ? "absolute top-3 left-3 z-50 bg-background/90 shadow-sm backdrop-blur"
              : "mb-4",
          )}
        />
        {children}
      </main>
    </SidebarProvider>
  );
}
