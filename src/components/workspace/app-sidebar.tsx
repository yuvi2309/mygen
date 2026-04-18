"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, MessageSquare, Plus, Settings } from "lucide-react";
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

export function AppSidebar() {
  const pathname = usePathname();
  const { agents } = useAgents();

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

        {/* Agents */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Agents</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" asChild>
              <Link href="/agents/new">
                <Plus className="h-3 w-3" />
              </Link>
            </Button>
          </SidebarGroupLabel>
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
        </SidebarGroup>
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
