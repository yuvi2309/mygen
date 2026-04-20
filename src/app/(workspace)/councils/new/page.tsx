"use client";

import { useRouter } from "next/navigation";
import { AgentForm } from "@/components/agents/agent-form";
import { useAgents } from "@/hooks/use-agents";
import type { CreateAgentInput } from "@/lib/types";

export default function NewCouncilPage() {
  const router = useRouter();
  const { createAgent } = useAgents();

  function handleSave(input: CreateAgentInput) {
    const council = createAgent({ ...input, mode: "council" });
    router.push(`/councils/${council.id}`);
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create Council</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build a saved multi-expert council that can debate and consolidate decisions.
          </p>
        </div>
        <AgentForm onSave={handleSave} defaultMode="council" />
      </div>
    </div>
  );
}
