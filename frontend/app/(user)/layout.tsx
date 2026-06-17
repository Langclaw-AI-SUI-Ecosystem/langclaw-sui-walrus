"use client";

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserUsageBar } from "@/components/user-usage-bar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatSession = pathname?.startsWith("/chat/") ?? false;

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full min-w-0 flex-1 basis-0 max-w-[100vw]">
        {isChatSession ? (
          <>
            <SidebarTrigger className="absolute top-3 left-3 z-50 bg-background/90 shadow-sm backdrop-blur md:hidden" />
            <div className="relative h-[100dvh] max-w-none overflow-hidden p-0">
              {children}
            </div>
          </>
        ) : (
          <>
            {/* <div className="sticky top-0 z-30 border-border/70 border-b bg-background/95 backdrop-blur">
              <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col px-4 py-3 md:px-6">
                <UserUsageBar />
              </div>
            </div> */}
            <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col px-4 py-8 md:px-6">
              <SidebarTrigger className="mb-4 md:hidden" />
              {children}
            </div>
          </>
        )}
      </main>
    </SidebarProvider>
  );
}
