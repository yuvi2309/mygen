"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agents/agent-card";
import { useAgents } from "@/hooks/use-agents";

export default function CouncilsPage() {
  const { agents, deleteAgent } = useAgents();
  const councils = agents.filter((agent) => agent.mode === "council");

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Councils</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create saved expert councils and start new discussions from them anytime.
            </p>
          </div>
          <Button asChild>
            <Link href="/councils/new">
              <Plus className="mr-1 h-4 w-4" />
              New Council
            </Link>
          </Button>
        </div>

        {councils.length > 0 ? (
          <div className="grid gap-4">
            {councils.map((council) => (
              <AgentCard key={council.id} agent={council} onDelete={deleteAgent} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">No councils yet.</p>
            <Button className="mt-4" asChild>
              <Link href="/councils/new">Create your first council</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
