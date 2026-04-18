"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { type Agent, DEFAULT_AGENT } from "@/lib/types";
import { getAgent } from "@/lib/store";

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const agentId = params.agentId as string;
    if (agentId === "default") {
      setAgent(DEFAULT_AGENT);
      return;
    }
    const found = getAgent(agentId);
    if (!found) {
      router.replace("/chat");
      return;
    }
    setAgent(found);
  }, [params.agentId, router]);

  if (!agent) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading agent...</p>
      </div>
    );
  }

  return <ChatInterface agent={agent} />;
}
