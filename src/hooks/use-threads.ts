"use client";

import { useEffect, useState, useCallback } from "react";
import { getThreads, createThread as storeCreateThread, deleteThread as storeDeleteThread } from "@/lib/store";

interface StoredThread {
  id: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export function useThreads(agentId?: string) {
  const [threads, setThreads] = useState<StoredThread[]>([]);

  const refresh = useCallback(() => {
    setThreads(getThreads(agentId));
  }, [agentId]);

  useEffect(() => {
    refresh();
    // Listen for storage events (from other tabs and from same-tab dispatches)
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  const createThread = useCallback((targetAgentId: string, title?: string) => {
    const thread = storeCreateThread(targetAgentId, title);
    refresh();
    return thread;
  }, [refresh]);

  const deleteThread = useCallback((id: string) => {
    const result = storeDeleteThread(id);
    refresh();
    return result;
  }, [refresh]);

  return { threads, refresh, createThread, deleteThread };
}
