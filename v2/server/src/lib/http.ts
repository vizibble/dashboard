import type { Request, Response } from "express";
import { z } from "zod";

import { ApiError } from "@/lib/api-error";

function snakeCase(key: string): string {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function serialize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === "object" && isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        snakeCase(key),
        serialize(entry),
      ]),
    );
  }

  return value;
}

/**
 * Sends `{ data }` in the API's snake_case shape. When a shared response schema is given,
 * the payload is checked against it first, so the server fails loudly (500) instead of
 * sending the client something the contract doesn't allow.
 */
export function sendData(
  res: Response,
  value: unknown,
  status = 200,
  schema?: z.ZodType,
) {
  const data = serialize(value);
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.error("Response violates API contract", result.error.issues);
      throw new ApiError(500, "The server produced an invalid response");
    }
  }
  return res.status(status).json({ data });
}

export function parse<T extends z.ZodType>(
  schema: T,
  value: unknown,
): z.infer<T> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ApiError(
      400,
      result.error.issues[0]?.message ?? "Invalid request",
    );
  }

  return result.data;
}

export function uuidParam(
  value: string | string[] | undefined,
  name: string,
): string {
  const result = z
    .uuid()
    .safeParse(typeof value === "string" ? value : undefined);

  if (!result.success) {
    throw new ApiError(400, `Invalid ${name}`);
  }

  return result.data;
}

export function textParam(
  value: string | string[] | undefined,
  name: string,
): string {
  if (typeof value !== "string") {
    throw new ApiError(400, `Invalid ${name}`);
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > 255) {
    throw new ApiError(400, `Invalid ${name}`);
  }

  return trimmed;
}

export function body(req: Request): unknown {
  return req.body;
}
