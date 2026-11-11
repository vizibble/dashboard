import { Router } from "express";
import { routes } from "@vizibble/shared/routes";
import { rateLimit } from "express-rate-limit";

import {
  ingestTelemetryController,
  listTelemetryController,
} from "@/controllers/telemetry";
import { requireOrganisationMember } from "@/middleware/require-organisation-member";
import { requireUser } from "@/middleware/require-user";
import { requirePermission } from "@/lib/permissions";

export const telemetryRouter = Router();

telemetryRouter.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

telemetryRouter.post(routes.telemetry.ingest, ingestTelemetryController);
telemetryRouter
  .route(routes.telemetry.collection)
  .all(requireUser, requireOrganisationMember)
  .get(requirePermission({ telemetry: ["read"] }), listTelemetryController);
