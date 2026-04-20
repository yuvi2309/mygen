"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Agent, AgentTool, CouncilExpert, CreateAgentInput } from "@/lib/types";
import { DEFAULT_COUNCIL_CONFIG } from "@/lib/types";
import { MODEL_OPTIONS, TOOL_OPTIONS, MODEL_PROVIDERS } from "@/lib/ai/options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AgentFormProps {
  agent?: Agent;
  onSave: (input: CreateAgentInput) => void;
  defaultMode?: "single" | "council";
}

function makeExpert(seed?: Partial<CouncilExpert>): CouncilExpert {
  return {
    id: seed?.id ?? crypto.randomUUID(),
    name: seed?.name ?? "",
    role: seed?.role ?? "",
    instructions: seed?.instructions ?? "",
  };
}

export function AgentForm({ agent, onSave, defaultMode = "single" }: AgentFormProps) {
  const router = useRouter();
  const [name, setName] = useState(agent?.name ?? "");
  const [purpose, setPurpose] = useState(agent?.purpose ?? "");
  const [instructions, setInstructions] = useState(agent?.instructions ?? "");
  const [model, setModel] = useState(agent?.model ?? "groq:llama-3.3-70b-versatile");
  const [tools, setTools] = useState<AgentTool[]>(agent?.tools ?? []);
  const [temperature, setTemperature] = useState(agent?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(agent?.maxTokens ?? 4096);
  const [mode, setMode] = useState<"single" | "council">(agent?.mode ?? defaultMode);
  const [authorityName, setAuthorityName] = useState(agent?.council?.authorityName ?? DEFAULT_COUNCIL_CONFIG.authorityName);
  const [rounds, setRounds] = useState(agent?.council?.rounds ?? DEFAULT_COUNCIL_CONFIG.rounds);
  const [synthesisStyle, setSynthesisStyle] = useState<"balanced" | "critical" | "action">(
    agent?.council?.synthesisStyle ?? DEFAULT_COUNCIL_CONFIG.synthesisStyle
  );
  const [councilExperts, setCouncilExperts] = useState<CouncilExpert[]>(() => {
    const experts = agent?.council?.experts?.length ? agent.council.experts : DEFAULT_COUNCIL_CONFIG.experts;
    return experts.map((expert) => makeExpert(expert));
  });

  const validCouncilExperts = useMemo(
    () =>
      councilExperts
        .map((expert) => ({
          ...expert,
          name: expert.name.trim(),
          role: expert.role.trim(),
          instructions: expert.instructions?.trim() || undefined,
        }))
        .filter((expert) => expert.name && expert.role),
    [councilExperts]
  );

  function handleToggleTool(toolId: AgentTool) {
    setTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((t) => t !== toolId)
        : [...prev, toolId]
    );
  }

  function updateExpert(expertId: string, field: keyof CouncilExpert, value: string) {
    setCouncilExperts((prev) =>
      prev.map((expert) =>
        expert.id === expertId ? { ...expert, [field]: value } : expert
      )
    );
  }

  function addExpert() {
    setCouncilExperts((prev) => [...prev, makeExpert()]);
  }

  function removeExpert(expertId: string) {
    setCouncilExperts((prev) => (prev.length <= 2 ? prev : prev.filter((expert) => expert.id !== expertId)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === "council" && validCouncilExperts.length < 2) return;

    onSave({
      name: name.trim(),
      purpose: purpose.trim() || undefined,
      instructions: instructions.trim() || undefined,
      model,
      tools,
      temperature,
      maxTokens,
      mode,
      council:
        mode === "council"
          ? {
              authorityName: authorityName.trim() || DEFAULT_COUNCIL_CONFIG.authorityName,
              rounds,
              synthesisStyle,
              experts: validCouncilExperts,
            }
          : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>Give this assistant or council a clear mission.</CardDescription>
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
              placeholder="e.g. Growth Council"
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
              placeholder="e.g. Debates product strategy and recommends the best next move"
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
              placeholder="How should this system think, decide, and communicate?"
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground">{instructions.length}/5000</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Execution Mode</CardTitle>
          <CardDescription>Choose between a single assistant or a debating expert council.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <label className="flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="mode"
              checked={mode === "single"}
              onChange={() => setMode("single")}
              className="mt-0.5 accent-primary"
            />
            <div>
              <p className="text-sm font-medium">Single agent</p>
              <p className="text-xs text-muted-foreground">One assistant responds directly.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="mode"
              checked={mode === "council"}
              onChange={() => setMode("council")}
              className="mt-0.5 accent-primary"
            />
            <div>
              <p className="text-sm font-medium">Council</p>
              <p className="text-xs text-muted-foreground">Multiple experts debate, critique, and a central authority consolidates the decision.</p>
            </div>
          </label>
        </CardContent>
      </Card>

      {mode === "council" && (
        <Card>
          <CardHeader>
            <CardTitle>Council Setup</CardTitle>
            <CardDescription>Define the specialist voices and how the council reaches a conclusion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="authorityName" className="text-sm font-medium">
                  Central Authority
                </label>
                <Input
                  id="authorityName"
                  value={authorityName}
                  onChange={(e) => setAuthorityName(e.target.value)}
                  placeholder="e.g. Chief Decision Officer"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="rounds" className="text-sm font-medium">
                  Debate Rounds
                </label>
                <Input
                  id="rounds"
                  type="number"
                  min={1}
                  max={3}
                  value={rounds}
                  onChange={(e) => setRounds(Math.min(3, Math.max(1, Number.parseInt(e.target.value, 10) || 1)))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="synthesisStyle" className="text-sm font-medium">
                Final Output Style
              </label>
              <select
                id="synthesisStyle"
                value={synthesisStyle}
                onChange={(e) => setSynthesisStyle(e.target.value as "balanced" | "critical" | "action")}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="balanced">Balanced</option>
                <option value="critical">Critical</option>
                <option value="action">Action-oriented</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Experts</p>
                  <p className="text-xs text-muted-foreground">Add at least two specialists with distinct viewpoints.</p>
                </div>
                <Button type="button" variant="outline" onClick={addExpert} disabled={councilExperts.length >= 6}>
                  Add expert
                </Button>
              </div>

              {councilExperts.map((expert, index) => (
                <div key={expert.id} className="space-y-3 rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Expert {index + 1}</p>
                    <Button type="button" variant="ghost" onClick={() => removeExpert(expert.id)} disabled={councilExperts.length <= 2}>
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={expert.name}
                        onChange={(e) => updateExpert(expert.id, "name", e.target.value)}
                        placeholder="e.g. Product Strategist"
                        maxLength={60}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Role</label>
                      <Input
                        value={expert.role}
                        onChange={(e) => updateExpert(expert.id, "role", e.target.value)}
                        placeholder="e.g. GTM and growth expert"
                        maxLength={120}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Critique focus</label>
                    <Textarea
                      value={expert.instructions ?? ""}
                      onChange={(e) => updateExpert(expert.id, "instructions", e.target.value)}
                      placeholder="What should this expert challenge, validate, or optimize?"
                      rows={3}
                      maxLength={1000}
                    />
                  </div>
                </div>
              ))}

              {validCouncilExperts.length < 2 && (
                <p className="text-xs text-destructive">Council mode needs at least two fully defined experts.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Model</CardTitle>
          <CardDescription>Choose the AI model used by this assistant or council.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MODEL_PROVIDERS.map((provider) => (
              <div key={provider}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {provider}
                </p>
                <div className="grid gap-2">
                  {MODEL_OPTIONS.filter((opt) => opt.provider === provider).map((opt) => (
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
          <CardDescription>Select which tools this assistant can use during synthesis.</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>Adjust the balance between precision, creativity, and verbosity.</CardDescription>
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
              onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 4096)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!name.trim() || (mode === "council" && validCouncilExperts.length < 2)}>
          {agent ? "Save Changes" : mode === "council" ? "Create Council" : "Create Agent"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
