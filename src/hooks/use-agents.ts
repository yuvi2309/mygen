"use client";

import { useEffect, useState, useCallback } from "react";
import { DEFAULT_AGENT, type Agent } from "@/lib/types";
import { getAgents, createAgent as storeCreateAgent, updateAgent as storeUpdateAgent, deleteAgent as storeDeleteAgent } from "@/lib/store";
import type { CreateAgentInput } from "@/lib/types";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([DEFAULT_AGENT]);

  useEffect(() => {
    const handler = () => setAgents(getAgents());
    const timeoutId = window.setTimeout(handler, 0);
    window.addEventListener("storage", handler);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const refresh = useCallback(() => {
    setAgents(getAgents());
  }, []);

  const createAgent = useCallback((input: CreateAgentInput) => {
    const agent = storeCreateAgent(input);
    refresh();
    return agent;
  }, [refresh]);

  const updateAgent = useCallback((id: string, updates: Partial<CreateAgentInput>) => {
    const agent = storeUpdateAgent(id, updates);
    refresh();
    return agent;
  }, [refresh]);

  const deleteAgent = useCallback((id: string) => {
    const result = storeDeleteAgent(id);
    refresh();
    return result;
  }, [refresh]);

  return { agents, refresh, createAgent, updateAgent, deleteAgent };
}
