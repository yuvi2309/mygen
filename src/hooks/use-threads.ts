"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getThreads,
  createThread as storeCreateThread,
  deleteThread as storeDeleteThread,
  archiveThread as storeArchiveThread,
  bulkArchiveThreads as storeBulkArchiveThreads,
  bulkDeleteThreads as storeBulkDeleteThreads,
  togglePinThread as storeTogglePinThread,
  setThreadTags as storeSetThreadTags,
  forkThread as storeForkThread,
  type StoredThread,
} from "@/lib/store";

export function useThreads(agentId?: string) {
  const [threads, setThreads] = useState<StoredThread[]>([]);

  const refresh = useCallback(() => {
    setThreads(getThreads(agentId));
  }, [agentId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => refresh(), 0);
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("storage", handler);
    };
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

  const archiveThread = useCallback((id: string, archived?: boolean) => {
    const result = storeArchiveThread(id, archived);
    refresh();
    return result;
  }, [refresh]);

  const bulkArchiveThreads = useCallback((ids: string[], archived?: boolean) => {
    const result = storeBulkArchiveThreads(ids, archived);
    refresh();
    return result;
  }, [refresh]);

  const bulkDeleteThreads = useCallback((ids: string[]) => {
    const result = storeBulkDeleteThreads(ids);
    refresh();
    return result;
  }, [refresh]);

  const togglePinThread = useCallback((id: string) => {
    const result = storeTogglePinThread(id);
    refresh();
    return result;
  }, [refresh]);

  const setThreadTags = useCallback((id: string, tags: string[]) => {
    const result = storeSetThreadTags(id, tags);
    refresh();
    return result;
  }, [refresh]);

  const forkThread = useCallback((sourceThreadId: string, options?: { title?: string; upToMessageId?: string }) => {
    const result = storeForkThread(sourceThreadId, options);
    refresh();
    return result;
  }, [refresh]);

  return {
    threads,
    refresh,
    createThread,
    deleteThread,
    archiveThread,
    bulkArchiveThreads,
    bulkDeleteThreads,
    togglePinThread,
    setThreadTags,
    forkThread,
  };
}
