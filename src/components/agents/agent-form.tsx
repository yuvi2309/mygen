"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Agent, AgentModel, AgentTool, CreateAgentInput } from "@/lib/types";
import { MODEL_OPTIONS, TOOL_OPTIONS } from "@/lib/ai/options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AgentFormProps {
  agent?: Agent;
  onSave: (input: CreateAgentInput) => void;
}

export function AgentForm({ agent, onSave }: AgentFormProps) {
  const router = useRouter();
  const [name, setName] = useState(agent?.name ?? "");
  const [purpose, setPurpose] = useState(agent?.purpose ?? "");
  const [instructions, setInstructions] = useState(agent?.instructions ?? "");
  const [model, setModel] = useState<AgentModel>(agent?.model ?? "gpt-4o-mini");
  const [tools, setTools] = useState<AgentTool[]>(agent?.tools ?? []);
  const [temperature, setTemperature] = useState(agent?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(agent?.maxTokens ?? 4096);

  function handleToggleTool(toolId: AgentTool) {
    setTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((t) => t !== toolId)
        : [...prev, toolId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      purpose: purpose.trim() || undefined,
      instructions: instructions.trim() || undefined,
      model,
      tools,
      temperature,
      maxTokens,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>Give your agent a name and purpose.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research Assistant"
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="purpose" className="text-sm font-medium">
              Purpose
            </label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Helps research topics and summarize findings"
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="instructions" className="text-sm font-medium">
              Instructions
            </label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Detailed instructions for how this agent should behave..."
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground">
              {instructions.length}/5000
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Model */}
      <Card>
        <CardHeader>
          <CardTitle>Model</CardTitle>
          <CardDescription>Choose the AI model for this agent.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {MODEL_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="model"
                  value={opt.id}
                  checked={model === opt.id}
                  onChange={() => setModel(opt.id)}
                  className="accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
          <CardDescription>Select which tools this agent can use.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {TOOL_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="checkbox"
                  checked={tools.includes(opt.id)}
                  onChange={() => handleToggleTool(opt.id)}
                  className="accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>Adjust model behavior.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="temperature" className="text-sm font-medium">
              Temperature: {temperature}
            </label>
            <input
              id="temperature"
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="maxTokens" className="text-sm font-medium">
              Max Tokens
            </label>
            <Input
              id="maxTokens"
              type="number"
              min={100}
              max={16000}
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!name.trim()}>
          {agent ? "Save Changes" : "Create Agent"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
