import type { Request, Response } from "express";

import { ApiError } from "@/lib/api-error";
import { body, parse, sendData, textParam, uuidParam } from "@/lib/http";
import {
  countActiveDevicesQuery,
  createTemplateQuery,
  findCurrentVersionQuery,
  findMetricDefinitionByKeyQuery,
  findMetricDefinitionsQuery,
  findTemplateQuery,
  insertMetricDefinitionQuery,
  listMetricDefinitionsQuery,
  listParameterHistoryQuery,
  listParametersQuery,
  listTemplatesQuery,
  removeTemplateQuery,
  replaceParametersQuery,
  updateTemplateQuery,
  type ParameterValues,
} from "@/models/templates";
import {
  createMetricDefinitionSchema,
  createTemplateSchema,
  replaceTemplateParametersSchema,
  updateTemplateSchema,
  metricDefinitionSchema,
  templateSchema,
  templateSummarySchema,
  type TemplateParameterInput,
} from "@vizibble/shared/templates";

function organisationParam(req: Request) {
  return textParam(req.params.organisationId, "organisation id");
}

/** Validates catalogue references (must be built-in or this organisation's) and normalises input. */
async function toParameterValues(
  organisationId: string,
  parameters: TemplateParameterInput[],
): Promise<ParameterValues[]> {
  const ids = [
    ...new Set(
      parameters.flatMap((p) =>
        p.metric_definition_id ? [p.metric_definition_id] : [],
      ),
    ),
  ];
  const definitions = await findMetricDefinitionsQuery(ids, organisationId);
  const byId = new Map(definitions.map((d) => [d.id, d]));
  return parameters.map((p) => {
    const definition = p.metric_definition_id
      ? byId.get(p.metric_definition_id)
      : undefined;
    if (p.metric_definition_id && !definition) {
      throw new ApiError(400, `Unknown parameter "${p.label}"`);
    }
    if (
      definition &&
      (definition.key !== p.key || definition.dataType !== p.data_type)
    ) {
      throw new ApiError(
        400,
        `Parameter "${p.label}" does not match its definition`,
      );
    }
    return {
      metricDefinitionId: definition?.id ?? null,
      key: p.key,
      label: p.label,
      dataType: p.data_type,
      unit: p.unit ?? null,
      symbol: p.symbol ?? null,
    };
  });
}

/**
 * Telemetry is stored by key, so a key must keep one data type for the life of a template.
 * Re-adding a removed parameter is allowed, as long as its type is unchanged.
 */
async function assertCompatibleWithHistory(
  templateId: string,
  parameters: ParameterValues[],
) {
  const history = await listParameterHistoryQuery(templateId);
  const typeByKey = new Map(history.map((h) => [h.key, h.dataType]));
  for (const parameter of parameters) {
    const previous = typeByKey.get(parameter.key);
    if (previous && previous !== parameter.dataType) {
      throw new ApiError(
        409,
        `"${parameter.label}" was previously recorded as ${previous}. Use a new key to record a different type.`,
      );
    }
  }
}

async function templateResponse(templateId: string, organisationId: string) {
  const template = await findTemplateQuery(templateId, organisationId);
  const current = await findCurrentVersionQuery(templateId, organisationId);
  if (!template || !current) throw new ApiError(404, "Template not found");
  const [parameters, deviceCount] = await Promise.all([
    listParametersQuery(current.id),
    countActiveDevicesQuery(templateId),
  ]);
  return { ...template, parameters, deviceCount };
}

export async function listTemplatesController(req: Request, res: Response) {
  return sendData(
    res,
    await listTemplatesQuery(organisationParam(req)),
    200,
    templateSummarySchema.array(),
  );
}

export async function createTemplateController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const values = parse(createTemplateSchema, body(req));
  const parameters = await toParameterValues(organisationId, values.parameters);
  const created = await createTemplateQuery(
    {
      organizationId: organisationId,
      name: values.name,
      description: values.description ?? null,
    },
    parameters,
  );
  return sendData(
    res,
    await templateResponse(created.id, organisationId),
    201,
    templateSchema,
  );
}

export async function getTemplateController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const id = uuidParam(req.params.templateId, "template id");
  return sendData(
    res,
    await templateResponse(id, organisationId),
    200,
    templateSchema,
  );
}

export async function updateTemplateController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const id = uuidParam(req.params.templateId, "template id");
  const values = parse(updateTemplateSchema, body(req));
  const updated = await updateTemplateQuery(id, organisationId, {
    ...(values.name === undefined ? {} : { name: values.name }),
    ...(values.description === undefined
      ? {}
      : { description: values.description }),
  });
  if (!updated) throw new ApiError(404, "Template not found");
  return sendData(
    res,
    await templateResponse(id, organisationId),
    200,
    templateSchema,
  );
}

export async function replaceTemplateParametersController(
  req: Request,
  res: Response,
) {
  const organisationId = organisationParam(req);
  const id = uuidParam(req.params.templateId, "template id");
  const values = parse(replaceTemplateParametersSchema, body(req));
  if (!(await findTemplateQuery(id, organisationId))) {
    throw new ApiError(404, "Template not found");
  }
  const parameters = await toParameterValues(organisationId, values.parameters);
  await assertCompatibleWithHistory(id, parameters);
  const result = await replaceParametersQuery(id, organisationId, parameters);
  if (!result) throw new ApiError(404, "Template not found");
  return sendData(
    res,
    await templateResponse(id, organisationId),
    200,
    templateSchema,
  );
}

export async function deleteTemplateController(req: Request, res: Response) {
  const organisationId = organisationParam(req);
  const id = uuidParam(req.params.templateId, "template id");
  if (!(await findTemplateQuery(id, organisationId))) {
    throw new ApiError(404, "Template not found");
  }
  const devices = await countActiveDevicesQuery(id);
  if (devices > 0) {
    throw new ApiError(
      409,
      `This template is used by ${devices} device${devices === 1 ? "" : "s"}. Move or delete them first.`,
    );
  }
  await removeTemplateQuery(id, organisationId);
  return res.status(204).send();
}

export async function listMetricDefinitionsController(
  req: Request,
  res: Response,
) {
  return sendData(
    res,
    await listMetricDefinitionsQuery(organisationParam(req)),
    200,
    metricDefinitionSchema.array(),
  );
}

export async function createMetricDefinitionController(
  req: Request,
  res: Response,
) {
  const organisationId = organisationParam(req);
  const values = parse(createMetricDefinitionSchema, body(req));
  const existing = await findMetricDefinitionByKeyQuery(
    values.key,
    organisationId,
  );
  if (existing) {
    throw new ApiError(
      409,
      `A parameter with key "${values.key}" already exists`,
    );
  }
  const created = await insertMetricDefinitionQuery({
    organizationId: organisationId,
    key: values.key,
    label: values.label,
    dataType: values.data_type,
    unit: values.unit ?? null,
    symbol: values.symbol ?? null,
    category: values.category ?? "Custom",
  });
  return sendData(res, created, 201, metricDefinitionSchema);
}
