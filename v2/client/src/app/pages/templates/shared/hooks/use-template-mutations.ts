import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deviceQueries } from '@/app/pages/devices/shared/queries';
import {
  createMetricDefinition,
  createTemplate,
  deleteTemplate,
  replaceTemplateParameters,
  updateTemplate,
} from '@/app/pages/templates/shared/api';
import { templateQueries } from '@/app/pages/templates/shared/queries';
import type {
  CreateMetricDefinitionInput,
  CreateTemplateInput,
  Template,
  TemplateParameterInput,
  UpdateTemplateInput,
} from '@/app/pages/templates/shared/types';

/** Caches the returned template and refreshes the list. */
function useStoreTemplate(organisationId: string) {
  const queryClient = useQueryClient();

  return async (template: Template) => {
    queryClient.setQueryData(templateQueries.detail(organisationId, template.id).queryKey, template);
    await queryClient.invalidateQueries({ queryKey: templateQueries.list(organisationId).queryKey });
  };
}

/** Creates a template together with its parameters. */
export function useCreateTemplate(organisationId: string) {
  const storeTemplate = useStoreTemplate(organisationId);

  return useMutation({
    mutationFn: (values: CreateTemplateInput) => createTemplate(organisationId, values),
    onSuccess: storeTemplate,
  });
}

export function useUpdateTemplate(organisationId: string) {
  const queryClient = useQueryClient();

  const storeTemplate = useStoreTemplate(organisationId);

  return useMutation({
    mutationFn: ({ templateId, values }: { templateId: string; values: UpdateTemplateInput }) =>
      updateTemplate(organisationId, templateId, values),
    onSuccess: async (template) => {
      await Promise.all([
        storeTemplate(template),
        // Devices show their template's name.
        queryClient.invalidateQueries({ queryKey: deviceQueries.all(organisationId) }),
      ]);
    },
  });
}

/** Replaces a template's parameters. Devices using it pick up the change automatically. */
export function useReplaceTemplateParameters(organisationId: string) {
  const storeTemplate = useStoreTemplate(organisationId);

  return useMutation({
    mutationFn: ({ templateId, parameters }: { templateId: string; parameters: TemplateParameterInput[] }) =>
      replaceTemplateParameters(organisationId, templateId, parameters),
    onSuccess: storeTemplate,
  });
}

/** Deletes a template (only allowed when no devices use it). */
export function useDeleteTemplate(organisationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(organisationId, templateId),
    onSuccess: async (_, templateId) => {
      queryClient.removeQueries({
        queryKey: templateQueries.detail(organisationId, templateId).queryKey,
        exact: true,
      });
      await queryClient.invalidateQueries({ queryKey: templateQueries.list(organisationId).queryKey });
    },
  });
}

/** Adds a custom parameter to the organisation's catalogue. */
export function useCreateMetricDefinition(organisationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateMetricDefinitionInput) => createMetricDefinition(organisationId, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: templateQueries.catalogue(organisationId).queryKey }),
  });
}
