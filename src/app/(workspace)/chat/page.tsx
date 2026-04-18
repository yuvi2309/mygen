"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { DEFAULT_AGENT } from "@/lib/types";

export default function ChatPage() {
  return <ChatInterface agent={DEFAULT_AGENT} />;
}
