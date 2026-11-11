import { z } from "zod";

import type { Delegation, VizibbleClient } from "@/vizibble/client";

/** Everything a tool may know about who is asking. Never derived from model output. */
export type ToolContext = {
  channel: "mcp" | "whatsapp";
  userId: string;
  delegation: Delegation;
  api: VizibbleClient;
  clientId?: string;
  conversationId?: string;
  requestId?: string;
  /** Organisation the conversation is focused on (WhatsApp); still re-checked by the main API. */
  activeOrganisationId?: string | null;
  defaultOrganisationId?: string | null;
};

export type ToolErrorCode =
  | "invalid_input"
  | "organisation_required"
  | "not_found"
  | "forbidden"
  | "unauthorised"
  | "unavailable"
  | "result_too_large"
  | "internal";

/** A failure the caller (a model or a person) can act on. Messages are safe to show. */
export class ToolError extends Error {
  constructor(
    readonly code: ToolErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ToolError";
  }
}

export type ToolResult = Record<string, unknown>;

/** What a tool author writes: a typed handler for an already-validated input. */
type ToolSpec<Input extends z.ZodObject> = {
  name: string;
  title: string;
  /** Written for models: when to use it, what it returns, what it can't do. */
  description: string;
  input: Input;
  /** "write" tools change data and always need the user's explicit approval first. */
  access?: "read" | "write";
  /** Writes only: one plain sentence describing exactly what will change, shown for approval. */
  describe?: (input: z.infer<Input>, context: ToolContext) => Promise<string>;
  run: (input: z.infer<Input>, context: ToolContext) => Promise<ToolResult>;
};

/** What the registry and channels see: one uniform shape for every tool. */
export type Tool = {
  name: string;
  title: string;
  description: string;
  input: z.ZodObject;
  access: "read" | "write";
  /** Validates the raw arguments against the tool's own schema, then runs it. */
  execute: (rawInput: unknown, context: ToolContext) => Promise<ToolResult>;
  /** The approval sentence for a write; a generic one when the input is invalid. */
  describeChange: (rawInput: unknown, context: ToolContext) => Promise<string>;
};

export function defineTool<Input extends z.ZodObject>(
  spec: ToolSpec<Input>,
): Tool {
  return {
    name: spec.name,
    title: spec.title,
    description: spec.description,
    input: spec.input,
    access: spec.access ?? "read",
    async execute(rawInput, context) {
      const parsed = spec.input.safeParse(rawInput ?? {});
      if (!parsed.success)
        throw new ToolError("invalid_input", z.prettifyError(parsed.error));
      return spec.run(parsed.data, context);
    },
    async describeChange(rawInput, context) {
      const parsed = spec.input.safeParse(rawInput ?? {});
      if (!parsed.success || !spec.describe) return spec.title;
      try {
        return await spec.describe(parsed.data, context);
      } catch {
        return spec.title;
      }
    },
  };
}
