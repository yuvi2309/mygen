"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AgentForm } from "@/components/agents/agent-form";
import { useAgents } from "@/hooks/use-agents";
import { getAgent } from "@/lib/store";
import type { CreateAgentInput } from "@/lib/types";

export default function EditCouncilPage() {
  const params = useParams();
  const router = useRouter();
  const { updateAgent } = useAgents();
  const council = useMemo(() => getAgent(params.councilId as string) ?? null, [params.councilId]);

  useEffect(() => {
    if (!council) {
      router.replace("/councils");
      return;
    }

    if (council.mode !== "council") {
      router.replace(`/agents/${council.id}`);
    }
  }, [council, router]);

  function handleSave(input: CreateAgentInput) {
    if (!council) return;
    updateAgent(council.id, { ...input, mode: "council" });
    router.push(`/councils/${council.id}`);
  }

  if (!council || council.mode !== "council") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading council...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Edit Council</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update the configuration for {council.name}.
          </p>
        </div>
        <AgentForm agent={council} onSave={handleSave} defaultMode="council" />
      </div>
    </div>
  );
}
