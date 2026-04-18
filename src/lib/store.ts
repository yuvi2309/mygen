"use client";

import { type Agent, type CreateAgentInput, DEFAULT_AGENT } from "@/lib/types";

const STORAGE_KEY = "mygen_agents";
const THREADS_KEY = "mygen_threads";

// ─── Agent Store ────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

export function getAgents(): Agent[] {
  if (typeof window === "undefined") return [DEFAULT_AGENT];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // Seed with default agent on first load
    localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_AGENT]));
    return [DEFAULT_AGENT];
  }
  return JSON.parse(stored) as Agent[];
}

export function getAgent(id: string): Agent | undefined {
  return getAgents().find((a) => a.id === id);
}

export function createAgent(input: CreateAgentInput): Agent {
  const now = new Date().toISOString();
  const agent: Agent = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const agents = getAgents();
  agents.push(agent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  return agent;
}

export function updateAgent(id: string, updates: Partial<CreateAgentInput>): Agent | undefined {
  const agents = getAgents();
  const index = agents.findIndex((a) => a.id === id);
  if (index === -1) return undefined;
  agents[index] = {
    ...agents[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  return agents[index];
}

export function deleteAgent(id: string): boolean {
  const agents = getAgents();
  const filtered = agents.filter((a) => a.id !== id);
  if (filtered.length === agents.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// ─── Thread Store ───────────────────────────────────────────────────────────

interface StoredThread {
  id: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export function getThreads(agentId?: string): StoredThread[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(THREADS_KEY);
  if (!stored) return [];
  const threads = JSON.parse(stored) as StoredThread[];
  return agentId ? threads.filter((t) => t.agentId === agentId) : threads;
}

export function createThread(agentId: string, title: string = "New conversation"): StoredThread {
  const now = new Date().toISOString();
  const thread: StoredThread = {
    id: generateId(),
    agentId,
    title,
    createdAt: now,
    updatedAt: now,
  };
  const threads = getThreads();
  threads.push(thread);
  localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  return thread;
}

export function deleteThread(id: string): boolean {
  const threads = getThreads();
  const filtered = threads.filter((t) => t.id !== id);
  if (filtered.length === threads.length) return false;
  localStorage.setItem(THREADS_KEY, JSON.stringify(filtered));
  return true;
}
