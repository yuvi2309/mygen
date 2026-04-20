"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { DEFAULT_AGENT } from "@/lib/types";
import { getAgent } from "@/lib/store";
import { useAgents } from "@/hooks/use-agents";

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const { agents } = useAgents();
  const agentId = params.agentId as string;
  const [agent, setAgent] = useState<typeof DEFAULT_AGENT | null | undefined>(undefined);

  useEffect(() => {
    const loadAgent = () => {
      if (agentId === "default") {
        setAgent(DEFAULT_AGENT);
        return;
      }

      setAgent(getAgent(agentId) ?? null);
    };

    loadAgent();
    window.addEventListener("storage", loadAgent);
    return () => window.removeEventListener("storage", loadAgent);
  }, [agentId]);

  useEffect(() => {
    if (agent === null) {
      router.replace("/chat");
      return;
    }

    if (agent?.mode === "council") {
      router.replace(`/councils/${agent.id}`);
    }
  }, [agent, router]);

  if (!agent) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading agent...</p>
      </div>
    );
  }

  function handleAgentChange(newAgent: typeof DEFAULT_AGENT) {
    router.replace(newAgent.mode === "council" ? `/councils/${newAgent.id}` : `/chat/${newAgent.id}`);
  }

  return (
    <ChatInterface
      agent={agent}
      agents={agents.filter((item) => item.mode !== "council")}
      onAgentChange={handleAgentChange}
      draftPath={`/chat/${agent.id}`}
      threadPathPrefix="/chat/t"
    />
  );
}
