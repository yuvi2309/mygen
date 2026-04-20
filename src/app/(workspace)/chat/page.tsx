"use client";

import { useMemo, useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { DEFAULT_AGENT } from "@/lib/types";
import { useAgents } from "@/hooks/use-agents";

export default function ChatPage() {
  const { agents } = useAgents();
  const singleAgents = useMemo(() => agents.filter((agent) => agent.mode !== "council"), [agents]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(DEFAULT_AGENT.id);

  const selectedAgent = singleAgents.find((agent) => agent.id === selectedAgentId) ?? DEFAULT_AGENT;

  return (
    <ChatInterface
      agent={selectedAgent}
      agents={singleAgents}
      onAgentChange={(agent) => setSelectedAgentId(agent.id)}
      draftPath="/chat"
      threadPathPrefix="/chat/t"
    />
  );
}
