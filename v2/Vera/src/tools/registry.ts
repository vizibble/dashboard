import { database } from "@/db/client";
import { toolCall } from "@/db/schema";
import { logger } from "@/lib/logger";
import { increment, recordDuration } from "@/lib/stats";
import { tools } from "@/tools/definitions";
import { toToolError } from "@/tools/helpers";
import {
  ToolError,
  type Tool,
  type ToolContext,
  type ToolResult,
} from "@/tools/types";

const MAX_RESULT_CHARACTERS = 60_000;

const toolsByName = new Map<string, Tool>(
  tools.map((tool) => [tool.name, tool]),
);

export type ToolOutcome =
  | { ok: true; result: ToolResult }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
      };
    };

/**
 * The single entry point for running a tool from any channel: allowlisted name, the tool's
 * own input validation, a result-size cap, and an audit row for every call.
 */
export async function executeTool(
  name: string,
  rawInput: unknown,
  context: ToolContext,
): Promise<ToolOutcome> {
  const started = performance.now();
  let outcome: ToolOutcome;

  try {
    const tool = toolsByName.get(name);
    if (!tool) throw new ToolError("invalid_input", `Unknown tool "${name}".`);
    const result = await tool.execute(rawInput, context);
    if (JSON.stringify(result).length > MAX_RESULT_CHARACTERS) {
      throw new ToolError(
        "result_too_large",
        "Too much data for one answer. Narrow the period, devices or metrics.",
      );
    }
    outcome = { ok: true, result };
  } catch (error) {
    const toolError = toToolError(error);
    if (toolError.code === "internal")
      logger.error("Tool failed", { tool: name, error });
    outcome = {
      ok: false,
      error: {
        code: toolError.code,
        message: toolError.message,
        details: toolError.details,
      },
    };
  }

  const durationMs = Math.round(performance.now() - started);
  await audit(name, rawInput, context, outcome, durationMs);
  return outcome;
}

async function audit(
  name: string,
  rawInput: unknown,
  context: ToolContext,
  outcome: ToolOutcome,
  durationMs: number,
) {
  const requested = (rawInput as { organisation_id?: unknown } | null)
    ?.organisation_id;
  const organisationId =
    typeof requested === "string"
      ? requested
      : (context.activeOrganisationId ?? null);
  const status = outcome.ok ? "ok" : "error";

  increment(`tool.${status}`);
  recordDuration(`tool.${name}`, durationMs);
  logger.info("Tool executed", {
    tool: name,
    status,
    durationMs,
    organisationId,
  });

  try {
    await database()
      .insert(toolCall)
      .values({
        id: crypto.randomUUID(),
        channel: context.channel,
        conversationId: context.conversationId ?? null,
        requestId: context.requestId ?? null,
        userId: context.userId,
        organisationId: organisationId?.slice(0, 255) ?? null,
        clientId: context.clientId ?? null,
        toolName: name.slice(0, 100),
        status,
        errorCode: outcome.ok ? null : outcome.error.code,
        errorMessage: outcome.ok ? null : outcome.error.message.slice(0, 500),
        durationMs,
        resultBytes: outcome.ok ? JSON.stringify(outcome.result).length : null,
      });
  } catch (error) {
    // The answer still goes out; a lost audit row is logged loudly.
    logger.error("Failed to record tool call", { tool: name, error });
  }
}
