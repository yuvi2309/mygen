"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AgentForm } from "@/components/agents/agent-form";
import { useAgents } from "@/hooks/use-agents";
import { getAgent } from "@/lib/store";
import type { CreateAgentInput } from "@/lib/types";

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const { updateAgent } = useAgents();
  const agent = useMemo(() => getAgent(params.agentId as string) ?? null, [params.agentId]);

  useEffect(() => {
    if (!agent) {
      router.replace("/agents");
    }
  }, [agent, router]);

  function handleSave(input: CreateAgentInput) {
    if (!agent) return;
    updateAgent(agent.id, input);
    router.push(`/chat/${agent.id}`);
  }

  if (!agent) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading agent...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Edit Agent</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update the configuration for {agent.name}.
          </p>
        </div>
        <AgentForm agent={agent} onSave={handleSave} />
      </div>
    </div>
  );
}
