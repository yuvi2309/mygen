"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agents/agent-card";
import { useAgents } from "@/hooks/use-agents";

export default function AgentsPage() {
  const { agents, deleteAgent } = useAgents();

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Agents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage your AI agents.
            </p>
          </div>
          <Button asChild>
            <Link href="/agents/new">
              <Plus className="h-4 w-4 mr-1" />
              New Agent
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onDelete={deleteAgent} />
          ))}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No agents yet.</p>
            <Button className="mt-4" asChild>
              <Link href="/agents/new">Create your first agent</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
