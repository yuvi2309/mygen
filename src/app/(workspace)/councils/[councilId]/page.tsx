"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import type { Agent } from "@/lib/types";
import { getAgent } from "@/lib/store";
import { useAgents } from "@/hooks/use-agents";

export default function CouncilPage() {
  const params = useParams();
  const router = useRouter();
  const { agents } = useAgents();
  const councilId = params.councilId as string;
  const [council, setCouncil] = useState<Agent | null | undefined>(undefined);

  useEffect(() => {
    const loadCouncil = () => {
      const nextCouncil = getAgent(councilId) ?? null;
      setCouncil(nextCouncil);
    };

    loadCouncil();
    window.addEventListener("storage", loadCouncil);
    return () => window.removeEventListener("storage", loadCouncil);
  }, [councilId]);

  useEffect(() => {
    if (council === null) {
      router.replace("/councils");
      return;
    }

    if (council && council.mode !== "council") {
      router.replace(`/chat/${council.id}`);
    }
  }, [council, router]);

  if (!council || council.mode !== "council") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading council...</p>
      </div>
    );
  }

  function handleCouncilChange(nextAgent: Agent) {
    router.replace(nextAgent.mode === "council" ? `/councils/${nextAgent.id}` : `/chat/${nextAgent.id}`);
  }

  return (
    <ChatInterface
      agent={council}
      agents={agents.filter((agent) => agent.mode === "council")}
      onAgentChange={handleCouncilChange}
      draftPath={`/councils/${council.id}`}
      threadPathPrefix="/councils/t"
    />
  );
}
