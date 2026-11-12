import { buildPath, routes } from '@vizibble/shared/routes';
import { metricDefinitionSchema, templateSchema, templateSummarySchema } from '@vizibble/shared/templates';

import type {
  CreateMetricDefinitionInput,
  CreateTemplateInput,
  TemplateParameterInput,
  UpdateTemplateInput,
} from '@/app/pages/templates/shared/types';
import { api } from '@/app/shared/utils/api-request';

export function getTemplates(organisationId: string, signal?: AbortSignal) {
  return api.get(buildPath(routes.templates.collection, { organisationId }), templateSummarySchema.array(), {
    signal,
  });
}

export function getTemplate(organisationId: string, templateId: string, signal?: AbortSignal) {
  return api.get(buildPath(routes.templates.item, { organisationId, templateId }), templateSchema, {
    signal,
  });
}

export function createTemplate(organisationId: string, values: CreateTemplateInput) {
  return api.post(buildPath(routes.templates.collection, { organisationId }), values, templateSchema);
}

export function updateTemplate(organisationId: string, templateId: string, values: UpdateTemplateInput) {
  return api.patch(buildPath(routes.templates.item, { organisationId, templateId }), values, templateSchema);
}

export function replaceTemplateParameters(
  organisationId: string,
  templateId: string,
  parameters: TemplateParameterInput[],
) {
  return api.put(
    buildPath(routes.templates.parameters, { organisationId, templateId }),
    { parameters },
    templateSchema,
  );
}

export function deleteTemplate(organisationId: string, templateId: string) {
  return api.delete(buildPath(routes.templates.item, { organisationId, templateId }));
}

export function getMetricDefinitions(organisationId: string, signal?: AbortSignal) {
  return api.get(
    buildPath(routes.metricDefinitions.collection, { organisationId }),
    metricDefinitionSchema.array(),
    {
      signal,
    },
  );
}

export function createMetricDefinition(organisationId: string, values: CreateMetricDefinitionInput) {
  return api.post(
    buildPath(routes.metricDefinitions.collection, { organisationId }),
    values,
    metricDefinitionSchema,
  );
}
