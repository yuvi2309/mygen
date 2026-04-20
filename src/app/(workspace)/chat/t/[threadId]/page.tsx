"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { DEFAULT_AGENT, type Agent } from "@/lib/types";
import { getAgent, getThread, getMessages, type StoredMessage, type StoredThread } from "@/lib/store";
import { useAgents } from "@/hooks/use-agents";

export default function ThreadChatPage() {
  const params = useParams();
  const router = useRouter();
  const { agents } = useAgents();
  const threadId = params.threadId as string;
  const [thread, setThread] = useState<StoredThread | null | undefined>(undefined);
  const [initialMessages, setInitialMessages] = useState<StoredMessage[] | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const loadConversation = () => {
      const nextThread = getThread(threadId) ?? null;
      setThread(nextThread);
      setInitialMessages(nextThread ? getMessages(threadId) : null);
      setAgent(nextThread ? getAgent(nextThread.agentId) ?? DEFAULT_AGENT : null);
    };

    loadConversation();
    window.addEventListener("storage", loadConversation);
    return () => window.removeEventListener("storage", loadConversation);
  }, [threadId]);

  useEffect(() => {
    if (thread === null) {
      router.replace("/chat");
      return;
    }

    if (agent?.mode === "council") {
      router.replace(`/councils/t/${threadId}`);
    }
  }, [agent, thread, threadId, router]);

  if (!agent || !thread || initialMessages === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  function handleAgentChange(newAgent: Agent) {
    router.replace(newAgent.mode === "council" ? `/councils/${newAgent.id}` : `/chat/${newAgent.id}`);
  }

  return (
    <ChatInterface
      agent={agent}
      agents={agents.filter((item) => item.mode !== "council")}
      onAgentChange={handleAgentChange}
      threadId={threadId}
      initialMessages={initialMessages}
      draftPath={`/chat/${agent.id}`}
      threadPathPrefix="/chat/t"
    />
  );
}
