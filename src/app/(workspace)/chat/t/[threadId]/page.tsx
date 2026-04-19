"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { DEFAULT_AGENT, type Agent } from "@/lib/types";
import { getAgent, getThread, getMessages } from "@/lib/store";
import { useAgents } from "@/hooks/use-agents";

export default function ThreadChatPage() {
  const params = useParams();
  const router = useRouter();
  const { agents } = useAgents();
  const threadId = params.threadId as string;
  const thread = useMemo(() => getThread(threadId), [threadId]);
  const initialMessages = useMemo(() => (thread ? getMessages(threadId) : null), [thread, threadId]);
  const agent = useMemo(() => {
    if (!thread) return null;
    return getAgent(thread.agentId) ?? DEFAULT_AGENT;
  }, [thread]);

  useEffect(() => {
    if (!thread) {
      router.replace("/chat");
    }
  }, [thread, router]);

  if (!agent || !thread || initialMessages === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  function handleAgentChange(newAgent: Agent) {
    router.replace(`/chat/${newAgent.id}`);
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
