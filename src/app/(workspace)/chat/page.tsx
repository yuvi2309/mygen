"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { DEFAULT_AGENT, type Agent } from "@/lib/types";
import { useAgents } from "@/hooks/use-agents";

export default function ChatPage() {
  const { agents } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<Agent>(DEFAULT_AGENT);

  return (
    <ChatInterface
      agent={selectedAgent}
      agents={agents}
      onAgentChange={setSelectedAgent}
    />
  );
}
