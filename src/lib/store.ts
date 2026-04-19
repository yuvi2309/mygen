"use client";

import { type Agent, type CreateAgentInput, DEFAULT_AGENT } from "@/lib/types";

const STORAGE_KEY = "mygen_agents";
const THREADS_KEY = "mygen_threads";
function threadMessagesKey(threadId: string) {
  return `mygen_thread_msgs_${threadId}`;
}

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

export function updateThread(id: string, updates: Partial<Pick<StoredThread, "title">>): StoredThread | undefined {
  const threads = getThreads();
  const index = threads.findIndex((t) => t.id === id);
  if (index === -1) return undefined;
  threads[index] = {
    ...threads[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  return threads[index];
}

export function getThread(id: string): StoredThread | undefined {
  return getThreads().find((t) => t.id === id);
}

export function deleteThread(id: string): boolean {
  const threads = getThreads();
  const filtered = threads.filter((t) => t.id !== id);
  if (filtered.length === threads.length) return false;
  localStorage.setItem(THREADS_KEY, JSON.stringify(filtered));
  // Clean up messages for this thread
  localStorage.removeItem(threadMessagesKey(id));
  return true;
}

// ─── Thread Messages Store ──────────────────────────────────────────────────
// Messages are stored separately per thread to avoid loading all messages
// when just reading the thread list.

export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: Array<{ id: string; name: string; args: Record<string, unknown> }>;
  toolCallId?: string;
  toolName?: string;
  parts?: unknown[];
  createdAt: string;
}

export function getMessages(threadId: string): StoredMessage[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(threadMessagesKey(threadId));
  if (!stored) return [];
  try {
    return JSON.parse(stored) as StoredMessage[];
  } catch {
    return [];
  }
}

export function saveMessages(threadId: string, messages: StoredMessage[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(threadMessagesKey(threadId), JSON.stringify(messages));
  // Touch the thread's updatedAt
  updateThread(threadId, {});
}
