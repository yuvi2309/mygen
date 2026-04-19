"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible } from "radix-ui";
import { Bot, ChevronDown, MessageSquare, Plus, Settings } from "lucide-react";
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
  const { threads } = useThreads();
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Bot className="h-6 w-6" />
          <span>MyGen</span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Quick Actions */}
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

        {/* Agents — collapsible */}
        <Collapsible.Root open={agentsOpen} onOpenChange={setAgentsOpen}>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between pr-1">
              <Collapsible.Trigger asChild>
                <button className="flex items-center gap-1 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
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

        {/* Chats — collapsible */}
        <Collapsible.Root open={chatsOpen} onOpenChange={setChatsOpen}>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between pr-1">
              <Collapsible.Trigger asChild>
                <button className="flex items-center gap-1 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  <ChevronDown className={`h-3 w-3 transition-transform ${chatsOpen ? "" : "-rotate-90"}`} />
                  <span>Chats</span>
                </button>
              </Collapsible.Trigger>
            </SidebarGroupLabel>
            <Collapsible.Content>
              <SidebarGroupContent>
                <SidebarMenu>
                  {threads.map((thread) => (
                    <SidebarMenuItem key={thread.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/chat/t/${thread.id}`}
                      >
                        <Link href={`/chat/t/${thread.id}`}>
                          <MessageSquare className="h-4 w-4" />
                          <span className="truncate">{thread.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {threads.length === 0 && (
                    <p className="px-4 py-2 text-xs text-muted-foreground">
                      No chats yet. Start a conversation.
                    </p>
                  )}
                </SidebarMenu>
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
