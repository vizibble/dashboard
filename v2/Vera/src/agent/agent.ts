import {
  Agent,
  assistant,
  run,
  RunState,
  setDefaultOpenAIClient,
  setTracingDisabled,
  tool,
  user,
  type AgentInputItem,
} from "@openai/agents";
import OpenAI from "openai";
import { z } from "zod";

import { checkOutput, POLICY } from "@/agent/guardrails";
import { env } from "@/config/env";
import { increment } from "@/lib/stats";
import { tools } from "@/tools/definitions";
import { executeTool } from "@/tools/registry";
import { ToolError, type ToolContext } from "@/tools/types";

/**
 * Vera's WhatsApp assistant on the OpenAI Agents SDK: one manager agent, the shared tool
 * allowlist, and SDK-native human-in-the-loop. Every write tool has `needsApproval`, so the
 * run pauses, the user approves on WhatsApp, and the same run resumes from its saved state.
 */

const MAX_TURNS = 10;

const INSTRUCTIONS = `You are Vera, Vizibble’s AI assistant, answering on WhatsApp. You help people at industrial plants understand and manage their devices, locations, templates, telemetry and dashboards. You speak for Vizibble: professional, precise and friendly. If asked, you are "Vera by Vizibble"; don’t name the underlying AI model or provider.

How to work:
- Use the tools for every fact. Resolve names the user mentions ("BOPP Line 6", "production areas") with list_devices, list_locations or list_templates, then use ids.
- For complex questions, plan the lookups, call independent tools together, and combine the results before answering.
- If a request is ambiguous (several matches, no organisation chosen, unclear period or target), ask one short clarifying question instead of guessing. "Today", "yesterday" and "this week" are in the organisation's timezone.
- If the user has several organisations and none is selected, ask which one, then call select_organisation.

Changes (create, update, delete):
- Only make a change the user clearly asked for, with every detail resolved (names to ids, the exact target). Never chain extra changes they didn't ask for.
- Call the change tool directly: the user is automatically asked to approve it on WhatsApp before it runs. Don't ask "are you sure?" yourself.
- If a change was declined, acknowledge it and don't retry it. If it failed, explain the reason from the tool result.

What a good answer contains:
- Lead with the direct answer, then the insight: highest/lowest device, trend (rising/falling, by how much), change versus the previous period, devices with no data or offline. Use the "highlights" and "vs_previous_period" figures the tools compute rather than calculating yourself.
- Always give units, device names and when readings were taken (local time, short format).
- Say plainly when data is missing or a device is offline. Never invent, estimate or fill in values, and never treat missing data as zero.
- Don't speculate about causes of abnormal readings; you may suggest what to check.
- Keep it short for WhatsApp: a few lines or a compact list, *bold* for key numbers, no tables or headings.

${POLICY}`;

export type AgentTurn = { role: "user" | "assistant"; content: string };

export type AgentOutcome =
  | {
      kind: "reply";
      reply: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      activeOrganisationId: string | null;
    }
  | {
      kind: "approval";
      summary: string;
      state: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      activeOrganisationId: string | null;
    };

let configured = false;
function configure() {
  if (configured) return;
  setDefaultOpenAIClient(
    new OpenAI({
      apiKey: env().OPENAI_API_KEY,
      timeout: 90_000,
      maxRetries: 2,
    }),
  );
  // Traces would leave conversation content with a third party; Vera keeps its own audit trail.
  setTracingDisabled(true);
  configured = true;
}

/** The tool's Zod input as the SDK's non-strict JSON Schema (optional fields stay optional). */
function toolSchema(input: z.ZodObject) {
  const schema = z.toJSONSchema(input) as {
    properties?: Record<string, Record<string, unknown>>;
    required?: string[];
  };
  return {
    type: "object" as const,
    properties: schema.properties ?? {},
    required: schema.required ?? [],
    additionalProperties: true as const,
  };
}

/**
 * Builds the agent for one user. Tools close over that user's context, so the run state the
 * SDK serialises for approvals never contains credentials.
 */
function buildAgent(context: ToolContext) {
  const agentTools = tools.map((definition) =>
    tool({
      name: definition.name,
      description: definition.description,
      // Non-strict JSON Schema keeps optional fields optional; the registry validates with Zod.
      parameters: toolSchema(definition.input),
      strict: false,
      needsApproval: definition.access === "write",
      async execute(input) {
        const outcome = await executeTool(definition.name, input, context);
        return outcome.ok ? outcome.result : { error: outcome.error };
      },
    }),
  );

  const selectOrganisation = tool({
    name: "select_organisation",
    description:
      "Switches this conversation to another organisation the user belongs to. Use the id from list_organizations.",
    parameters: z.object({ organisation_id: z.string().min(1).max(255) }),
    async execute({ organisation_id }) {
      try {
        // The main API confirms membership before the choice is kept.
        const organisation = await context.api.organisation(
          context.delegation,
          organisation_id,
        );
        context.activeOrganisationId = organisation.id;
        return {
          selected: {
            id: organisation.id,
            name: organisation.name,
            role: organisation.role,
          },
        };
      } catch {
        return {
          error: new ToolError(
            "forbidden",
            "That organisation isn't available to this user.",
          ).message,
        };
      }
    },
  });

  return new Agent({
    name: "Vera",
    instructions: () =>
      `${INSTRUCTIONS}\n\nCurrent time (UTC): ${new Date().toISOString()}.`,
    model: env().AI_MODEL,
    modelSettings: { parallelToolCalls: true, maxTokens: 4000 },
    tools: [...agentTools, selectOrganisation],
  });
}

type Result = Awaited<ReturnType<typeof run<Agent, undefined>>>;

async function outcomeOf(
  result: Result,
  agent: Agent,
  context: ToolContext,
): Promise<AgentOutcome> {
  const usage = result.runContext.usage;
  const base = {
    model: env().AI_MODEL,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    activeOrganisationId: context.activeOrganisationId ?? null,
  };
  const pending = result.interruptions ?? [];
  if (pending.length > 0) {
    increment("agent.approval_requested");
    const lines = await Promise.all(
      pending.map(async (item) => {
        const definition = tools.find((t) => t.name === item.name);
        let args: unknown = {};
        try {
          args = JSON.parse(item.arguments ?? "{}");
        } catch {
          // Invalid arguments fail validation when the tool runs.
        }
        return definition
          ? definition.describeChange(args, context)
          : `Run ${item.name}`;
      }),
    );
    return {
      kind: "approval",
      summary: lines.map((line) => `• ${line}`).join("\n"),
      state: result.state.toString(),
      ...base,
    };
  }
  increment("agent.answered");
  void agent;
  return {
    kind: "reply",
    reply: checkOutput(String(result.finalOutput ?? "")),
    ...base,
  };
}

/** Answers a new message, or pauses with a proposed change for the user to approve. */
export async function runAgent(
  history: AgentTurn[],
  message: string,
  context: ToolContext,
): Promise<AgentOutcome> {
  configure();
  const agent = buildAgent(context);
  const input: AgentInputItem[] = [
    ...history.map((turn) =>
      turn.role === "user" ? user(turn.content) : assistant(turn.content),
    ),
    user(message),
  ];
  const result = await run(agent, input, { maxTurns: MAX_TURNS });
  return outcomeOf(result as Result, agent, context);
}

/** Resumes a paused run once the user has approved or declined the proposed change(s). */
export async function resumeAgent(
  savedState: string,
  approved: boolean,
  context: ToolContext,
): Promise<AgentOutcome> {
  configure();
  const agent = buildAgent(context);
  const state = await RunState.fromString(agent, savedState);
  for (const item of state.getInterruptions()) {
    if (approved) state.approve(item);
    else state.reject(item);
  }
  increment(approved ? "agent.approved" : "agent.declined");
  const result = await run(agent, state, { maxTurns: MAX_TURNS });
  return outcomeOf(result as Result, agent, context);
}
