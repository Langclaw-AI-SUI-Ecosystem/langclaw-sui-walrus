"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import {
  Cable,
  CalendarSync,
  ChevronDown,
  CircleFadingPlus,
  Cpu,
  CreditCard,
  Database,
  Bookmark,
  FlaskConical,
  LogOut,
  MessagesSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Settings,
  ShieldCheck,
  Trash2,
  User2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import {
  useCurrentAccount,
  useDisconnectWallet,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
  CHAT_SESSIONS_UPDATED_EVENT,
  deleteChatSession,
  dispatchChatSessionsUpdated,
  listChatSessions,
  type ChatSession,
  updateChatSessionMetadata,
} from "@/lib/langclaw-api";
import {
  useWalletSession,
  WALLET_AUTH_UPDATED_EVENT,
} from "@/hooks/use-wallet-session";
import { Badge } from "./ui/badge";
import { LangclawLogo } from "./LangclawLogo";

type SidebarNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const workspaceNavItems: SidebarNavItem[] = [
  {
    href: "/chat",
    icon: CircleFadingPlus,
    label: "Chat / Research",
  },
  {
    href: "/task",
    icon: CalendarSync,
    label: "Automation Task",
  },
  {
    href: "/usage",
    icon: Database,
    label: "Usage",
  },
  {
    href: "/watchlist",
    icon: Bookmark,
    label: "Alpha Watchlist",
  },
  {
    href: "/strategy",
    icon: FlaskConical,
    label: "Strategy Lab",
  },
  {
    href: "/proofs",
    icon: ShieldCheck,
    label: "Proof Center",
  },
];

const systemNavItems: SidebarNavItem[] = [
  {
    href: "/key",
    icon: Cable,
    label: "API Console",
  },
  {
    href: "/memory",
    icon: Cpu,
    label: "Memory",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
  },
];

export function AppSidebar() {
  const account = useCurrentAccount();
  const address = account?.address;
  const isConnected = Boolean(account);
  const pathname = usePathname();
  const { getWalletAuth, openWalletModal } = useWalletSession();
  // const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const { data: balanceUser } = useSuiClientQuery(
    "getBalance",
    { owner: address ?? "" },
    { enabled: Boolean(address) },
  );
  const balanceLabel = useMemo(() => {
    if (!balanceUser) return null;

    const numericBalance = Number(balanceUser.totalBalance) / 1e9;
    const compactBalance = Number.isFinite(numericBalance)
      ? numericBalance.toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })
      : "0";

    return `${compactBalance} SUI`;
  }, [balanceUser]);
  const activeChainLabel = "Sui Mainnet";
  const { mutate: disconnect } = useDisconnectWallet();
  const pinnedSessions = useMemo(
    () => sessions.filter((session) => session.pinned),
    [sessions],
  );
  const recentSessions = useMemo(
    () => sessions.filter((session) => !session.pinned),
    [sessions],
  );

  const refreshSessions = useCallback(async () => {
    if (!isConnected || !address) {
      setSessions([]);
      setSessionsError("");
      setIsLoadingSessions(false);
      return;
    }

    setIsLoadingSessions(true);

    try {
      const wallet = await getWalletAuth();
      const nextSessions = await listChatSessions(wallet);
      setSessions(nextSessions);
      setSessionsError("");
    } catch {
      // Chat-session storage isn't part of the Sui backend, so this call will
      // fail. Treat it as "no saved chats" rather than surfacing a scary error
      // toast on every page.
      setSessions([]);
      setSessionsError("");
    } finally {
      setIsLoadingSessions(false);
    }
  }, [address, getWalletAuth, isConnected]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshSessions();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshSessions]);

  // useEffect(() => {
  //   const timeoutId = window.setTimeout(() => {
  //     void checkBackendHealth()
  //       .then(() => setBackendOnline(true))
  //       .catch(() => {
  //         setBackendOnline(false);
  //         toast.error("Backend offline");
  //       });
  //   }, 0);

  //   return () => window.clearTimeout(timeoutId);
  // }, []);

  useEffect(() => {
    window.addEventListener(CHAT_SESSIONS_UPDATED_EVENT, refreshSessions);
    window.addEventListener(WALLET_AUTH_UPDATED_EVENT, refreshSessions);

    return () => {
      window.removeEventListener(CHAT_SESSIONS_UPDATED_EVENT, refreshSessions);
      window.removeEventListener(WALLET_AUTH_UPDATED_EVENT, refreshSessions);
    };
  }, [refreshSessions]);

  const handleTogglePinned = useCallback(
    async (session: ChatSession) => {
      try {
        const wallet = await getWalletAuth();
        const updated = await updateChatSessionMetadata(wallet, {
          pinned: !session.pinned,
          sessionId: session.id,
        });
        setSessions((current) =>
          current.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  ...(updated ?? {}),
                  messages: item.messages,
                  pinned: updated?.pinned ?? !session.pinned,
                }
              : item,
          ),
        );
        dispatchChatSessionsUpdated();
        toast.success(session.pinned ? "Chat unpinned" : "Chat pinned");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to update chat.",
        );
      }
    },
    [getWalletAuth],
  );

  const openRenameDialog = useCallback((session: ChatSession) => {
    setRenameTarget(session);
    setRenameTitle(session.title);
  }, []);

  const handleRenameSession = useCallback(async () => {
    if (!renameTarget) {
      return;
    }

    const title = renameTitle.trim().replace(/\s+/g, " ");

    if (!title) {
      toast.error("Chat title is required");
      return;
    }

    try {
      const wallet = await getWalletAuth();
      const updated = await updateChatSessionMetadata(wallet, {
        sessionId: renameTarget.id,
        title,
      });
      setSessions((current) =>
        current.map((item) =>
          item.id === renameTarget.id
            ? {
                ...item,
                ...(updated ?? {}),
                messages: item.messages,
                title: updated?.title ?? title,
              }
            : item,
        ),
      );
      setRenameTarget(null);
      setRenameTitle("");
      dispatchChatSessionsUpdated();
      toast.success("Chat renamed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to rename chat.",
      );
    }
  }, [getWalletAuth, renameTarget, renameTitle]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      const wallet = await getWalletAuth();
      await deleteChatSession(wallet, deleteTarget.id);
      setSessions((current) =>
        current.filter((session) => session.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      dispatchChatSessionsUpdated();
      toast.success("Chat deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete chat.",
      );
    }
  }, [deleteTarget, getWalletAuth]);

  // if (isReconnecting) {
  //   <p>hai</p>;
  // }

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-3">
        <Link
          aria-label="Langclaw home"
          className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent"
          href="/"
        >
          <LangclawLogo
            className="size-9 shrink-0 rounded-md ring-1 ring-sidebar-border"
            imageClassName="left-[315%] h-[320px] w-[320px]"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-5">
              Langclaw
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Sui Walrus Private Memory
            </span>
          </span>
        </Link>
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/35 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-sidebar-foreground">
              Workspace
            </span>
            <Badge className="px-1.5 py-0 text-[10px]" variant="secondary">
              Research + Proof
            </Badge>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Sui Walrus research workspace
          </p>
        </div>
        <SidebarMenu className="mt-1">
          <SidebarNavItems items={workspaceNavItems} pathname={pathname} />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1 py-2">
        <SidebarGroup className="py-1">
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarNavItems items={systemNavItems} pathname={pathname} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup className="py-1">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center gap-2">
                <span>Pinned</span>
                <span className="ml-auto rounded bg-sidebar-accent px-1.5 text-[10px] font-medium text-muted-foreground">
                  {pinnedSessions.length}
                </span>
                <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SessionMenuItems
                    emptyLabel={
                      isConnected ? "No pinned chats" : "Connect wallet first"
                    }
                    isLoading={isLoadingSessions}
                    onDeleteRequest={setDeleteTarget}
                    onRenameRequest={openRenameDialog}
                    onTogglePinned={handleTogglePinned}
                    pathname={pathname}
                    sessions={pinnedSessions}
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup className="py-1">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center gap-2">
                <span>Recents</span>
                <span className="ml-auto rounded bg-sidebar-accent px-1.5 text-[10px] font-medium text-muted-foreground">
                  {recentSessions.length}
                </span>
                <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SessionMenuItems
                    emptyLabel={
                      isConnected ? "No recent chats" : "Connect wallet first"
                    }
                    isLoading={isLoadingSessions}
                    onDeleteRequest={setDeleteTarget}
                    onRenameRequest={openRenameDialog}
                    onTogglePinned={handleTogglePinned}
                    pathname={pathname}
                    sessions={recentSessions}
                  />
                </SidebarMenu>
                {sessionsError && (
                  <p className="px-2 pt-2 text-xs text-destructive">
                    {sessionsError}
                  </p>
                )}
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        {isConnected ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    className="h-auto gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/35 p-3 hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
                    size="lg"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-sidebar-foreground">
                      <User2 className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium text-sidebar-foreground">
                          {address
                            ? `${address.slice(0, 6)}...${address.slice(-4)}`
                            : "Wallet"}
                        </span>
                        <Badge
                          className="max-w-24 shrink-0 truncate px-1.5 py-0 text-[10px]"
                          variant="secondary"
                        >
                          {activeChainLabel}
                        </Badge>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {balanceLabel ?? "Balance loading"}
                      </span>
                    </span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" side="top">
                  <DropdownMenuItem>
                    <CreditCard />
                    <span>{balanceLabel ?? "-"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => disconnect()}>
                    <LogOut />
                    <span>Disconnect Wallet</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu className="gap-2">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/35 p-3 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="size-4" />
                <span>Wallet required</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Connect to load pinned and recent chats.
              </p>
            </div>
            <Button
              aria-label="Connect Wallet"
              className="w-full justify-start gap-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              onClick={openWalletModal}
              type="button"
            >
              <Wallet className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                Connect Wallet
              </span>
            </Button>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameTitle("");
          }
        }}
        open={Boolean(renameTarget)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>
              Update the title shown in pinned and recent chats.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleRenameSession();
            }}
          >
            <Input
              autoFocus
              maxLength={120}
              onChange={(event) => setRenameTitle(event.currentTarget.value)}
              value={renameTitle}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription>
              This removes the saved session and its messages.
            </DialogDescription>
          </DialogHeader>
          <p className="truncate font-medium">{deleteTarget?.title}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={() => void handleConfirmDelete()}
              type="button"
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}

function SidebarNavItems({
  items,
  pathname,
}: {
  items: SidebarNavItem[];
  pathname: string;
}) {
  return items.map((item) => {
    const Icon = item.icon;
    const isActive =
      pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.label}
        >
          <Link href={item.href}>
            <Icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  });
}

function SessionMenuItems({
  emptyLabel,
  isLoading,
  onDeleteRequest,
  onRenameRequest,
  onTogglePinned,
  pathname,
  sessions,
}: {
  emptyLabel: string;
  isLoading: boolean;
  onDeleteRequest: (session: ChatSession) => void;
  onRenameRequest: (session: ChatSession) => void;
  onTogglePinned: (session: ChatSession) => Promise<void>;
  pathname: string;
  sessions: ChatSession[];
}) {
  if (isLoading) {
    return (
      <>
        <SidebarMenuSkeleton showIcon />
        <SidebarMenuSkeleton showIcon />
        <SidebarMenuSkeleton showIcon />
      </>
    );
  }

  if (!sessions.length) {
    return (
      <SidebarMenuItem>
        <p className="rounded-md border border-dashed border-sidebar-border bg-sidebar-accent/30 px-2.5 py-2 text-xs leading-5 text-muted-foreground group-data-[collapsible=icon]:hidden">
          {emptyLabel}
        </p>
      </SidebarMenuItem>
    );
  }

  return sessions.map((session) => (
    <SidebarMenuItem key={session.id}>
      <SidebarMenuButton
        asChild
        isActive={pathname === `/chat/${session.id}`}
        tooltip={session.title}
      >
        <Link href={`/chat/${session.id}`}>
          <MessagesSquare />
          <span>{session.title}</span>
        </Link>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            aria-label={`Open actions for ${session.title}`}
            showOnHover
          >
            <MoreHorizontal />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right">
          <DropdownMenuItem onClick={() => onRenameRequest(session)}>
            <Pencil />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void onTogglePinned(session)}>
            {session.pinned ? <PinOff /> : <Pin />}
            <span>{session.pinned ? "Unpin" : "Pin"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDeleteRequest(session)}
            variant="destructive"
          >
            <Trash2 />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  ));
}
