"use client";

import { useRouter } from "next/navigation";
import { AgentForm } from "@/components/agents/agent-form";
import { useAgents } from "@/hooks/use-agents";
import type { CreateAgentInput } from "@/lib/types";

export default function NewAgentPage() {
  const router = useRouter();
  const { createAgent } = useAgents();

  function handleSave(input: CreateAgentInput) {
    const agent = createAgent(input);
    router.push(`/chat/${agent.id}`);
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create Agent</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define a new AI agent with a specific purpose, instructions, and tools.
          </p>
        </div>
        <AgentForm onSave={handleSave} />
      </div>
    </div>
  );
}
