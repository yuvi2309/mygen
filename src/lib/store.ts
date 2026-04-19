"use client";

import { type Agent, type CreateAgentInput, DEFAULT_AGENT } from "@/lib/types";

const STORAGE_KEY = "mygen_agents";
const THREADS_KEY = "mygen_threads";
const USERS_KEY = "mygen_users";
const CURRENT_USER_KEY = "mygen_current_user";
const USER_SCOPE_MIGRATION_KEY = "mygen_user_scope_v1";
const AUTO_ARCHIVE_AFTER_DAYS = 14;
const ARCHIVED_RETENTION_DAYS = 30;

export interface WorkspaceUser {
  id: string;
  name: string;
  createdAt: string;
}

const DEFAULT_WORKSPACE_USER: WorkspaceUser = {
  id: "personal",
  name: "Personal",
  createdAt: new Date().toISOString(),
};

function getUserStorageKey(baseKey: string, userId = getCurrentUserId()) {
  return `${baseKey}:${userId}`;
}

function threadMessagesKey(threadId: string, userId = getCurrentUserId()) {
  return `${getUserStorageKey("mygen_thread_msgs", userId)}:${threadId}`;
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function dispatchStorageSync() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }
}

function ensureWorkspaceUsers(): WorkspaceUser[] {
  if (typeof window === "undefined") return [DEFAULT_WORKSPACE_USER];

  const users = readJSON<WorkspaceUser[]>(USERS_KEY, []);
  if (users.length > 0) return users;

  localStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_WORKSPACE_USER]));
  localStorage.setItem(CURRENT_USER_KEY, DEFAULT_WORKSPACE_USER.id);
  return [DEFAULT_WORKSPACE_USER];
}

export function getWorkspaceUsers(): WorkspaceUser[] {
  return ensureWorkspaceUsers();
}

export function getCurrentUserId(): string {
  if (typeof window === "undefined") return DEFAULT_WORKSPACE_USER.id;

  const users = ensureWorkspaceUsers();
  const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
  if (currentUserId && users.some((user) => user.id === currentUserId)) {
    return currentUserId;
  }

  localStorage.setItem(CURRENT_USER_KEY, users[0].id);
  return users[0].id;
}

export function getCurrentUser(): WorkspaceUser {
  const users = ensureWorkspaceUsers();
  return users.find((user) => user.id === getCurrentUserId()) ?? users[0];
}

export function setCurrentUser(userId: string): WorkspaceUser | undefined {
  const users = ensureWorkspaceUsers();
  const nextUser = users.find((user) => user.id === userId);
  if (!nextUser || typeof window === "undefined") return undefined;

  localStorage.setItem(CURRENT_USER_KEY, nextUser.id);
  dispatchStorageSync();
  return nextUser;
}

export function createWorkspaceUser(name: string): WorkspaceUser {
  const users = ensureWorkspaceUsers();
  const trimmedName = name.trim();
  const user: WorkspaceUser = {
    id: generateId(),
    name: trimmedName || `User ${users.length + 1}`,
    createdAt: new Date().toISOString(),
  };

  const nextUsers = [...users, user];
  localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
  localStorage.setItem(CURRENT_USER_KEY, user.id);
  dispatchStorageSync();
  return user;
}

function migrateLegacyDataIfNeeded(userId: string) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(USER_SCOPE_MIGRATION_KEY) === "done") return;

  const legacyAgents = localStorage.getItem(STORAGE_KEY);
  if (legacyAgents && !localStorage.getItem(getUserStorageKey(STORAGE_KEY, userId))) {
    localStorage.setItem(getUserStorageKey(STORAGE_KEY, userId), legacyAgents);
  }

  const legacyThreadsRaw = localStorage.getItem(THREADS_KEY);
  if (legacyThreadsRaw && !localStorage.getItem(getUserStorageKey(THREADS_KEY, userId))) {
    localStorage.setItem(getUserStorageKey(THREADS_KEY, userId), legacyThreadsRaw);

    const legacyThreads = readJSON<Array<{ id: string }>>(THREADS_KEY, []);
    for (const thread of legacyThreads) {
      const legacyMessages = localStorage.getItem(`mygen_thread_msgs_${thread.id}`);
      if (legacyMessages && !localStorage.getItem(threadMessagesKey(thread.id, userId))) {
        localStorage.setItem(threadMessagesKey(thread.id, userId), legacyMessages);
      }
    }
  }

  localStorage.setItem(USER_SCOPE_MIGRATION_KEY, "done");
}

function writeThreads(threads: StoredThread[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getUserStorageKey(THREADS_KEY), JSON.stringify(threads));
  dispatchStorageSync();
}

function normalizeTags(tags?: string[]) {
  return Array.from(new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean)));
}

// ─── Agent Store ────────────────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID();
}

export function getAgents(): Agent[] {
  if (typeof window === "undefined") return [DEFAULT_AGENT];

  const userId = getCurrentUserId();
  migrateLegacyDataIfNeeded(userId);

  const key = getUserStorageKey(STORAGE_KEY, userId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify([DEFAULT_AGENT]));
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
  localStorage.setItem(getUserStorageKey(STORAGE_KEY), JSON.stringify(agents));
  dispatchStorageSync();
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
  localStorage.setItem(getUserStorageKey(STORAGE_KEY), JSON.stringify(agents));
  dispatchStorageSync();
  return agents[index];
}

export function deleteAgent(id: string): boolean {
  const agents = getAgents();
  const filtered = agents.filter((a) => a.id !== id);
  if (filtered.length === agents.length) return false;
  localStorage.setItem(getUserStorageKey(STORAGE_KEY), JSON.stringify(filtered));
  dispatchStorageSync();
  return true;
}

// ─── Thread Store ───────────────────────────────────────────────────────────

export interface StoredThread {
  id: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isArchived?: boolean;
  archivedAt?: string | null;
  tags?: string[];
  messageCount?: number;
  forkedFromThreadId?: string;
  forkedFromMessageId?: string;
}

function autoManageThreads(threads: StoredThread[]) {
  const now = Date.now();
  let changed = false;
  const managed: StoredThread[] = [];

  for (const rawThread of threads) {
    const thread: StoredThread = {
      ...rawThread,
      isPinned: !!rawThread.isPinned,
      isArchived: !!rawThread.isArchived,
      archivedAt: rawThread.archivedAt ?? null,
      tags: normalizeTags(rawThread.tags),
      messageCount: rawThread.messageCount ?? getMessages(rawThread.id).length,
    };

    if (thread.isArchived && thread.archivedAt) {
      const archivedAge = now - new Date(thread.archivedAt).getTime();
      if (archivedAge > ARCHIVED_RETENTION_DAYS * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(threadMessagesKey(thread.id));
        changed = true;
        continue;
      }
    }

    if (!thread.isArchived && !thread.isPinned) {
      const inactiveAge = now - new Date(thread.updatedAt).getTime();
      if (inactiveAge > AUTO_ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000) {
        thread.isArchived = true;
        thread.archivedAt = new Date().toISOString();
        changed = true;
      }
    }

    managed.push(thread);
  }

  if (changed) {
    writeThreads(managed);
  }

  return managed;
}

export function getThreads(agentId?: string): StoredThread[] {
  if (typeof window === "undefined") return [];
  const userId = getCurrentUserId();
  migrateLegacyDataIfNeeded(userId);
  const storedThreads = readJSON<StoredThread[]>(getUserStorageKey(THREADS_KEY, userId), []);
  const threads = autoManageThreads(storedThreads);
  const filtered = agentId ? threads.filter((t) => t.agentId === agentId) : threads;

  return filtered.sort((a, b) => {
    const pinDiff = Number(!!b.isPinned) - Number(!!a.isPinned);
    if (pinDiff !== 0) return pinDiff;

    const archiveDiff = Number(!!a.isArchived) - Number(!!b.isArchived);
    if (archiveDiff !== 0) return archiveDiff;

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function createThread(agentId: string, title: string = "New conversation"): StoredThread {
  const now = new Date().toISOString();
  const thread: StoredThread = {
    id: generateId(),
    agentId,
    title,
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    isArchived: false,
    archivedAt: null,
    tags: [],
    messageCount: 0,
  };
  const threads = getThreads();
  threads.push(thread);
  writeThreads(threads);
  return thread;
}

export function updateThread(
  id: string,
  updates: Partial<Omit<StoredThread, "id" | "createdAt">>
): StoredThread | undefined {
  const threads = getThreads();
  const index = threads.findIndex((t) => t.id === id);
  if (index === -1) return undefined;
  threads[index] = {
    ...threads[index],
    ...updates,
    tags: normalizeTags(updates.tags ?? threads[index].tags),
    updatedAt: new Date().toISOString(),
  };
  writeThreads(threads);
  return threads[index];
}

export function getThread(id: string): StoredThread | undefined {
  return getThreads().find((t) => t.id === id);
}

export function archiveThread(id: string, archived: boolean = true): StoredThread | undefined {
  return updateThread(id, {
    isArchived: archived,
    archivedAt: archived ? new Date().toISOString() : null,
  });
}

export function togglePinThread(id: string): StoredThread | undefined {
  const thread = getThread(id);
  if (!thread) return undefined;
  return updateThread(id, { isPinned: !thread.isPinned });
}

export function setThreadTags(id: string, tags: string[]): StoredThread | undefined {
  return updateThread(id, { tags: normalizeTags(tags) });
}

export function deleteThread(id: string): boolean {
  const threads = getThreads();
  const filtered = threads.filter((t) => t.id !== id);
  if (filtered.length === threads.length) return false;
  writeThreads(filtered);
  localStorage.removeItem(threadMessagesKey(id));
  dispatchStorageSync();
  return true;
}

export function bulkArchiveThreads(ids: string[], archived: boolean = true): number {
  let updated = 0;
  ids.forEach((id) => {
    if (archiveThread(id, archived)) updated += 1;
  });
  return updated;
}

export function bulkDeleteThreads(ids: string[]): number {
  let deleted = 0;
  ids.forEach((id) => {
    if (deleteThread(id)) deleted += 1;
  });
  return deleted;
}

export function clearThreadMessages(threadId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(threadMessagesKey(threadId), JSON.stringify([]));
  updateThread(threadId, { messageCount: 0 });
}

export function forkThread(
  sourceThreadId: string,
  options?: { title?: string; upToMessageId?: string }
): StoredThread | undefined {
  const sourceThread = getThread(sourceThreadId);
  if (!sourceThread) return undefined;

  const sourceMessages = getMessages(sourceThreadId);
  const cutIndex = options?.upToMessageId
    ? sourceMessages.findIndex((message) => message.id === options.upToMessageId)
    : sourceMessages.length - 1;

  const forkedThread = createThread(
    sourceThread.agentId,
    options?.title ?? `${sourceThread.title} (fork)`
  );

  const clonedMessages = sourceMessages
    .slice(0, cutIndex >= 0 ? cutIndex + 1 : sourceMessages.length)
    .map((message) => ({
      ...message,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }));

  saveMessages(forkedThread.id, clonedMessages);
  return updateThread(forkedThread.id, {
    tags: sourceThread.tags ?? [],
    forkedFromThreadId: sourceThread.id,
    forkedFromMessageId: options?.upToMessageId,
    messageCount: clonedMessages.length,
  });
}

// ─── Thread Messages Store ──────────────────────────────────────────────────

export interface StoredBranchChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  status?: "loading" | "done" | "error";
}

export interface StoredMessageBranch {
  id: string;
  selectedText: string;
  createdAt: string;
  title?: string;
  messages: StoredBranchChatMessage[];
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: Array<{ id: string; name: string; args: Record<string, unknown> }>;
  toolCallId?: string;
  toolName?: string;
  parts?: unknown[];
  createdAt: string;
  editedAt?: string;
  isPinned?: boolean;
  originalContent?: string;
  curatedSelections?: string[];
  branches?: StoredMessageBranch[];
}

export function getMessages(threadId: string): StoredMessage[] {
  if (typeof window === "undefined") return [];
  return readJSON<StoredMessage[]>(threadMessagesKey(threadId, getCurrentUserId()), []).map((message) => ({
    ...message,
    isPinned: !!message.isPinned,
    curatedSelections: message.curatedSelections ?? [],
    branches: (message.branches ?? []).map((branch) => {
      const legacyBranch = branch as StoredMessageBranch & { question?: string; answer?: string; status?: "loading" | "done" | "error" };
      return {
        ...legacyBranch,
        messages:
          legacyBranch.messages ?? [
            ...(legacyBranch.question
              ? [
                  {
                    id: generateId(),
                    role: "user" as const,
                    content: legacyBranch.question,
                    createdAt: legacyBranch.createdAt,
                    status: "done" as const,
                  },
                ]
              : []),
            {
              id: generateId(),
              role: "assistant" as const,
              content: legacyBranch.answer ?? "",
              createdAt: legacyBranch.createdAt,
              status: legacyBranch.status ?? "done",
            },
          ],
      };
    }),
  }));
}

export function saveMessages(threadId: string, messages: StoredMessage[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(threadMessagesKey(threadId, getCurrentUserId()), JSON.stringify(messages));
  updateThread(threadId, { messageCount: messages.length });
}

export function updateMessage(
  threadId: string,
  messageId: string,
  updates: Partial<Omit<StoredMessage, "id" | "createdAt">>
): StoredMessage | undefined {
  const messages = getMessages(threadId);
  const index = messages.findIndex((message) => message.id === messageId);
  if (index === -1) return undefined;

  messages[index] = {
    ...messages[index],
    ...updates,
    editedAt: updates.content !== undefined ? new Date().toISOString() : messages[index].editedAt,
  };

  saveMessages(threadId, messages);
  return messages[index];
}

export function togglePinMessage(threadId: string, messageId: string): StoredMessage | undefined {
  const message = getMessages(threadId).find((item) => item.id === messageId);
  if (!message) return undefined;
  return updateMessage(threadId, messageId, { isPinned: !message.isPinned });
}
