"use client";

import { useEffect, useMemo } from "react";
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
  const agent = useMemo(() => {
    if (agentId === "default") return DEFAULT_AGENT;
    return getAgent(agentId) ?? null;
  }, [agentId]);

  useEffect(() => {
    if (!agent) {
      router.replace("/chat");
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
    router.replace(`/chat/${newAgent.id}`);
  }

  return (
    <ChatInterface
      agent={agent}
      agents={agents}
      onAgentChange={handleAgentChange}
    />
  );
}
