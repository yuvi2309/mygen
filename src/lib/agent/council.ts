import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import type { CouncilConfig } from "@/lib/types";
import { streamAgent, type AgentGraphConfig } from "./graph";

function createCouncilModel(modelSpec: string, temperature: number = 0.7) {
  const colonIndex = modelSpec.indexOf(":");
  const provider = colonIndex === -1 ? "groq" : modelSpec.slice(0, colonIndex);
  const modelId = colonIndex === -1 ? modelSpec : modelSpec.slice(colonIndex + 1);

  switch (provider) {
    case "groq":
      return new ChatOpenAI({
        model: modelId,
        temperature,
        configuration: {
          baseURL: "https://api.groq.com/openai/v1",
          apiKey: process.env.GROQ_API_KEY,
        },
      });
    case "google":
      return new ChatGoogleGenerativeAI({ model: modelId, temperature });
    case "openai":
      return new ChatOpenAI({ model: modelId, temperature });
    default:
      throw new Error(`Unknown council provider "${provider}".`);
  }
}

function normalizeContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function serializeConversation(messages: BaseMessage[]) {
  return messages
    .map((message) => {
      const type = typeof (message as { _getType?: () => string })._getType === "function"
        ? (message as { _getType: () => string })._getType()
        : "message";

      const role =
        type === "human"
          ? "User"
          : type === "ai"
            ? "Assistant"
            : type === "tool"
              ? "Tool"
              : "System";

      const text = normalizeContent(message.content).trim();
      return text ? `${role}: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function sanitizeNodeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "council-expert";
}

function getSynthesisInstruction(style: CouncilConfig["synthesisStyle"]) {
  switch (style) {
    case "critical":
      return "Be candid and rigorous. Highlight the weakest assumptions before recommending a path.";
    case "action":
      return "Be decisive and operational. End with concrete next steps and ownership suggestions.";
    default:
      return "Be balanced and pragmatic. Weigh trade-offs and propose the strongest overall path.";
  }
}

async function chooseExpertsForRound(
  model: ReturnType<typeof createCouncilModel>,
  config: AgentGraphConfig & { council: CouncilConfig },
  conversation: string,
  debateEntries: string[],
  round: number
) {
  const selectorPrompt = [
    `You are ${config.council.authorityName}, the head of the ${config.agentName} council.`,
    "Choose only the experts who should speak in this round based on the user's query and the discussion so far.",
    "Prefer the smallest useful set, but choose at least 2 experts and at most all available experts.",
    "Return only a comma-separated list of expert names.",
    `Available experts: ${config.council.experts.map((expert) => `${expert.name} (${expert.role})`).join(", ")}`,
    `Conversation:\n${conversation}`,
    `Debate so far:\n${debateEntries.join("\n\n") || "No debate yet."}`,
    `Round ${round} of ${config.council.rounds}`,
  ].join("\n\n");

  const response = await model.invoke([
    new SystemMessage("Select the right experts for this council round."),
    new HumanMessage(selectorPrompt),
  ]);

  const raw = normalizeContent(response.content).toLowerCase();
  const selected = config.council.experts.filter((expert) => raw.includes(expert.name.toLowerCase()));

  return selected.length >= 2 ? selected : config.council.experts;
}

export async function* streamCouncilAgent(
  config: AgentGraphConfig & { council: CouncilConfig; temperature?: number },
  messages: BaseMessage[],
  threadId?: string
) {
  const councilModel = createCouncilModel(config.agentModel, config.temperature ?? 0.7);
  const conversation = serializeConversation(messages) || "No prior conversation context was provided.";
  const debateEntries: string[] = [];
  let stepCount = 0;

  for (let round = 1; round <= config.council.rounds; round += 1) {
    const selectedExperts = await chooseExpertsForRound(councilModel, config, conversation, debateEntries, round);

    yield {
      council_head: {
        messages: [
          new AIMessage({
            content: `### ${config.council.authorityName}\n\nRound ${round}: inviting ${selectedExperts.map((expert) => expert.name).join(", ")} to speak.`,
          }),
        ],
        stepCount,
      },
    };

    for (const expert of selectedExperts) {
      const discussionSoFar = debateEntries.length
        ? debateEntries.join("\n\n")
        : "No one has spoken yet. Open the discussion with your best expert view.";

      const expertPrompt = [
        `You are ${expert.name}, acting as the ${expert.role} on the ${config.agentName} council.`,
        expert.instructions ? `Your specialist lens: ${expert.instructions}` : "",
        "You were specifically chosen by the council head for this round.",
        "Every other participant is also an expert. Respect them, but do not agree automatically.",
        "Your job is to validate strong ideas, expose weak logic, and identify practical gaps.",
        "Avoid filler. Contribute a distinct point of view.",
      ]
        .filter(Boolean)
        .join("\n\n");

      const roundPrompt = [
        `Conversation to solve:\n${conversation}`,
        `Council discussion so far:\n${discussionSoFar}`,
        `This is round ${round} of ${config.council.rounds}.`,
        "Respond in three short sections:",
        "1. Position",
        "2. Critique",
        "3. Best next move",
      ].join("\n\n");

      const response = await councilModel.invoke([
        new SystemMessage(expertPrompt),
        new HumanMessage(roundPrompt),
      ]);

      const content = normalizeContent(response.content).trim();
      if (!content) continue;

      debateEntries.push(`${expert.name} (${expert.role}) · Round ${round}\n${content}`);
      stepCount += 1;

      yield {
        [sanitizeNodeName(expert.name)]: {
          messages: [
            new AIMessage({
              content: `### ${expert.name} — ${expert.role}\n\n${content}`,
            }),
          ],
          stepCount,
        },
      };
    }
  }

  const authorityName = config.council.authorityName || `${config.agentName} Authority`;
  const synthesisPrompt = [
    `You are ${authorityName}, the final authority for the ${config.agentName} council.`,
    config.agentInstructions ?? "",
    "The council has debated the issue. Consolidate the strongest reasoning into one final answer.",
    "Resolve disagreements instead of merely summarizing them.",
    "Use tools if they materially improve the final recommendation.",
    getSynthesisInstruction(config.council.synthesisStyle),
    "Use these sections in the final response:",
    "## Council consensus",
    "## Key risks and disagreements",
    "## Recommended actions",
  ]
    .filter(Boolean)
    .join("\n\n");

  const authorityContext = [
    "The internal council discussion is complete.",
    `Debate transcript:\n${debateEntries.join("\n\n") || "No transcript available."}`,
    "Now provide the final answer for the user.",
  ].join("\n\n");

  for await (const update of streamAgent(
    {
      ...config,
      agentName: authorityName,
      agentInstructions: synthesisPrompt,
    },
    [...messages, new HumanMessage(authorityContext)],
    threadId
  )) {
    yield update;
  }
}
