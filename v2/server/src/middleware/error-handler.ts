import { ApiError } from "@/lib/api-error";
import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (err?.code === "23505") {
    return res
      .status(409)
      .json({ error: "A record with these values already exists" });
  }

  if (err?.code === "23503") {
    return res.status(409).json({ error: "The record is still referenced" });
  }

  if (err?.code === "23514") {
    return res
      .status(400)
      .json({ error: "The record violates a data constraint" });
  }

  if (err?.code === "22003") {
    return res.status(400).json({ error: "Numeric value is out of range" });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
