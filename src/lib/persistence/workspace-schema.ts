import { z } from "zod/v4";
import { AgentSchema } from "@/lib/types/agent";

const JsonRecordSchema = z.record(z.string(), z.unknown());

export const StoredThreadSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  archivedAt: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  messageCount: z.number().optional(),
  forkedFromThreadId: z.string().optional(),
  forkedFromMessageId: z.string().optional(),
});

export const StoredMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  toolCalls: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        args: JsonRecordSchema,
      })
    )
    .optional(),
  toolCallId: z.string().optional(),
  toolName: z.string().optional(),
  parts: z.array(z.unknown()).optional(),
  createdAt: z.string(),
  editedAt: z.string().optional(),
  isPinned: z.boolean().optional(),
  originalContent: z.string().optional(),
  curatedSelections: z.array(z.string()).optional(),
  branches: z.array(z.unknown()).optional(),
});

export const WorkspaceSnapshotSchema = z.object({
  updatedAt: z.string(),
  agents: z.array(AgentSchema).default([]),
  threads: z.array(StoredThreadSchema).default([]),
  messagesByThread: z.record(z.string(), z.array(StoredMessageSchema)).default({}),
});

export type WorkspaceSnapshot = z.infer<typeof WorkspaceSnapshotSchema>;
