"use client";

import Link from "next/link";
import { Bot, MessageSquare, Pencil, Trash2 } from "lucide-react";
import type { Agent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AgentCardProps {
  agent: Agent;
  onDelete: (id: string) => void;
}

export function AgentCard({ agent, onDelete }: AgentCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{agent.name}</CardTitle>
            {agent.purpose && (
              <CardDescription className="mt-1">{agent.purpose}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
            {agent.model}
          </span>
          {agent.tools.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
            >
              {tool.replace("_", " ")}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href={`/chat/${agent.id}`}>
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Chat
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/agents/${agent.id}`}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Link>
          </Button>
          {agent.id !== "default" && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(agent.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
