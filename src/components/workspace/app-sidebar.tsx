"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible } from "radix-ui";
import { Archive, Bot, ChevronDown, MessageSquare, Plus, Settings, Star, Tag, Trash2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAgents } from "@/hooks/use-agents";
import { useThreads } from "@/hooks/use-threads";

export function AppSidebar() {
  const pathname = usePathname();
  const { agents } = useAgents();
  const {
    threads,
    archiveThread,
    bulkArchiveThreads,
    bulkDeleteThreads,
    togglePinThread,
    setThreadTags,
  } = useThreads();
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const visibleThreads = useMemo(
    () => (selectedTag ? threads.filter((thread) => thread.tags?.includes(selectedTag)) : threads),
    [threads, selectedTag]
  );

  const activeThreads = visibleThreads.filter((thread) => !thread.isArchived);
  const archivedThreads = visibleThreads.filter((thread) => thread.isArchived);
  const allTags = Array.from(new Set(threads.flatMap((thread) => thread.tags ?? []))).sort();

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function handleTagEdit(threadId: string, currentTags: string[]) {
    const value = window.prompt("Set tags separated by commas", currentTags.join(", "));
    if (value === null) return;
    setThreadTags(threadId, value.split(","));
  }

  function handleBulkArchive() {
    if (selectedIds.length === 0) return;
    bulkArchiveThreads(selectedIds, true);
    setSelectedIds([]);
    setManageMode(false);
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected chat(s)?`)) return;
    bulkDeleteThreads(selectedIds);
    setSelectedIds([]);
    setManageMode(false);
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Bot className="h-6 w-6" />
          <span>MyGen</span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/chat"}>
                  <Link href="/chat">
                    <MessageSquare className="h-4 w-4" />
                    <span>New Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <Collapsible.Root open={agentsOpen} onOpenChange={setAgentsOpen}>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between pr-1">
              <Collapsible.Trigger asChild>
                <button className="flex items-center gap-1 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground">
                  <ChevronDown className={`h-3 w-3 transition-transform ${agentsOpen ? "" : "-rotate-90"}`} />
                  <span>Agents</span>
                </button>
              </Collapsible.Trigger>
              <Button variant="ghost" size="icon" className="h-5 w-5" asChild>
                <Link href="/agents/new">
                  <Plus className="h-3 w-3" />
                </Link>
              </Button>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenu>
                  {agents.map((agent) => (
                    <SidebarMenuItem key={agent.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/chat/${agent.id}` || pathname === `/agents/${agent.id}`}
                      >
                        <Link href={`/chat/${agent.id}`}>
                          <Bot className="h-4 w-4" />
                          <span className="truncate">{agent.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {agents.length === 0 && (
                    <p className="px-4 py-2 text-xs text-muted-foreground">
                      No agents yet. Create one to get started.
                    </p>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>

        <SidebarSeparator />

        <Collapsible.Root open={chatsOpen} onOpenChange={setChatsOpen}>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between gap-2 pr-1">
              <Collapsible.Trigger asChild>
                <button className="flex items-center gap-1 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground">
                  <ChevronDown className={`h-3 w-3 transition-transform ${chatsOpen ? "" : "-rotate-90"}`} />
                  <span>Chats</span>
                </button>
              </Collapsible.Trigger>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => {
                setManageMode((prev) => !prev);
                setSelectedIds([]);
              }}>
                {manageMode ? "Done" : "Manage"}
              </Button>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <div className="space-y-3 px-2">
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTag(null)}
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${selectedTag === null ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                      >
                        All
                      </button>
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTag(tag)}
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${selectedTag === tag ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {manageMode && selectedIds.length > 0 && (
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={handleBulkArchive}>
                        <Archive className="mr-1 h-3 w-3" />
                        Archive
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={handleBulkDelete}>
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  )}

                  <div className="space-y-1">
                    {activeThreads.map((thread) => (
                      <div key={thread.id} className="group flex items-start gap-2 rounded-md border px-2 py-2">
                        {manageMode && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(thread.id)}
                            onChange={() => toggleSelected(thread.id)}
                            className="mt-1 h-3.5 w-3.5"
                          />
                        )}

                        <Link href={`/chat/t/${thread.id}`} className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 text-sm">
                            {thread.isPinned && <Star className="h-3.5 w-3.5 fill-current text-amber-500" />}
                            <span className="truncate">{thread.title}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {thread.messageCount ?? 0} messages
                          </div>
                          {!!thread.tags?.length && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {thread.tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </Link>

                        <div className="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => togglePinThread(thread.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Pin chat"
                          >
                            <Star className={`h-3.5 w-3.5 ${thread.isPinned ? "fill-current text-amber-500" : ""}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTagEdit(thread.id, thread.tags ?? [])}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Edit tags"
                          >
                            <Tag className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => archiveThread(thread.id, true)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Archive chat"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {activeThreads.length === 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">
                        No active chats yet.
                      </p>
                    )}
                  </div>

                  {archivedThreads.length > 0 && (
                    <Collapsible.Root open={archivedOpen} onOpenChange={setArchivedOpen}>
                      <div className="rounded-md border p-1">
                        <Collapsible.Trigger asChild>
                          <button className="flex w-full items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                            <ChevronDown className={`h-3 w-3 transition-transform ${archivedOpen ? "" : "-rotate-90"}`} />
                            Archived
                          </button>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <div className="space-y-1 px-1 pb-1">
                            {archivedThreads.map((thread) => (
                              <div key={thread.id} className="group flex items-start gap-2 rounded-md px-2 py-2">
                                {manageMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(thread.id)}
                                    onChange={() => toggleSelected(thread.id)}
                                    className="mt-1 h-3.5 w-3.5"
                                  />
                                )}
                                <Link href={`/chat/t/${thread.id}`} className="min-w-0 flex-1 text-sm text-muted-foreground">
                                  <span className="truncate block">{thread.title}</span>
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => archiveThread(thread.id, false)}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  aria-label="Restore chat"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </Collapsible.Content>
                      </div>
                    </Collapsible.Root>
                  )}
                </div>
              </SidebarGroupContent>
            </Collapsible.Content>
          </SidebarGroup>
        </Collapsible.Root>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/agents"}>
              <Link href="/agents">
                <Settings className="h-4 w-4" />
                <span>Manage Agents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
