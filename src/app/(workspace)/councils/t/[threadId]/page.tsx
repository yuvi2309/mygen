"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import type { Agent } from "@/lib/types";
import { DEFAULT_AGENT } from "@/lib/types";
import { getAgent, getMessages, getThread, type StoredMessage, type StoredThread } from "@/lib/store";
import { useAgents } from "@/hooks/use-agents";

export default function CouncilThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { agents } = useAgents();
  const threadId = params.threadId as string;
  const [thread, setThread] = useState<StoredThread | null | undefined>(undefined);
  const [initialMessages, setInitialMessages] = useState<StoredMessage[] | null>(null);
  const [council, setCouncil] = useState<Agent | null>(null);

  useEffect(() => {
    const loadConversation = () => {
      const nextThread = getThread(threadId) ?? null;
      setThread(nextThread);
      setInitialMessages(nextThread ? getMessages(threadId) : null);
      setCouncil(nextThread ? getAgent(nextThread.agentId) ?? DEFAULT_AGENT : null);
    };

    loadConversation();
    window.addEventListener("storage", loadConversation);
    return () => window.removeEventListener("storage", loadConversation);
  }, [threadId]);

  useEffect(() => {
    if (thread === null) {
      router.replace("/councils");
      return;
    }

    if (council?.mode && council.mode !== "council") {
      router.replace(`/chat/t/${threadId}`);
    }
  }, [council, thread, threadId, router]);

  if (!council || !thread || initialMessages === null || council.mode !== "council") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading discussion...</p>
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
      threadId={threadId}
      initialMessages={initialMessages}
      draftPath={`/councils/${council.id}`}
      threadPathPrefix="/councils/t"
    />
  );
}
