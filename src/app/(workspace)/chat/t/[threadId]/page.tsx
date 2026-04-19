"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { type Agent, DEFAULT_AGENT } from "@/lib/types";
import { getAgent, getThread, getMessages, type StoredMessage } from "@/lib/store";
import { useAgents } from "@/hooks/use-agents";

export default function ThreadChatPage() {
  const params = useParams();
  const router = useRouter();
  const { agents } = useAgents();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<StoredMessage[] | null>(null);

  useEffect(() => {
    const tid = params.threadId as string;
    const thread = getThread(tid);
    if (!thread) {
      router.replace("/chat");
      return;
    }

    setThreadId(tid);
    setInitialMessages(getMessages(tid));

    const foundAgent = getAgent(thread.agentId);
    setAgent(foundAgent ?? DEFAULT_AGENT);
  }, [params.threadId, router]);

  if (!agent || threadId === null || initialMessages === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  function handleAgentChange(newAgent: Agent) {
    setAgent(newAgent);
  }

  return (
    <ChatInterface
      agent={agent}
      agents={agents}
      onAgentChange={handleAgentChange}
      threadId={threadId}
      initialMessages={initialMessages}
    />
  );
}
