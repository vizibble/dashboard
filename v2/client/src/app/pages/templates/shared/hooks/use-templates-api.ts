import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deviceQueryKeys } from '@/app/pages/devices/shared/hooks/use-devices-api';
import {
  createMetricDefinition,
  createTemplate,
  deleteTemplate,
  getMetricDefinitions,
  getTemplate,
  getTemplates,
  replaceTemplateParameters,
  updateTemplate,
} from '@/app/pages/templates/shared/api';
import type {
  CreateMetricDefinitionInput,
  CreateTemplateInput,
  TemplateParameterInput,
  UpdateTemplateInput,
} from '@/app/pages/templates/shared/types';

// Cache keys for template queries.
export const templateQueryKeys = {
  all: ['templates'] as const,
  list: (organisationId: string) => ['templates', 'list', organisationId] as const,
  detail: (organisationId: string, templateId: string) => ['templates', 'detail', organisationId, templateId] as const,
  catalogue: (organisationId: string) => ['templates', 'catalogue', organisationId] as const,
};

// Fetch all templates (with parameter and device counts).
export function useFetchTemplates(organisationId: string) {
  const query = useQuery({
    queryKey: templateQueryKeys.list(organisationId),
    queryFn: ({ signal }) => getTemplates(organisationId, signal),
  });
  return { ...query, templates: query.data ?? [] };
}

// Fetch one template with its current parameters.
export function useFetchTemplate(organisationId: string, templateId: string | undefined) {
  const query = useQuery({
    queryKey: templateQueryKeys.detail(organisationId, templateId ?? ''),
    queryFn: ({ signal }) => getTemplate(organisationId, templateId!, signal),
    enabled: Boolean(templateId),
  });
  return { ...query, template: query.data };
}

// Fetch the parameter catalogue: built-in definitions plus the organisation's own.
export function useFetchMetricDefinitions(organisationId: string, enabled = true) {
  const query = useQuery({
    queryKey: templateQueryKeys.catalogue(organisationId),
    queryFn: ({ signal }) => getMetricDefinitions(organisationId, signal),
    enabled,
    staleTime: 5 * 60_000,
  });
  return { ...query, definitions: query.data ?? [] };
}

// Create a template together with its parameters.
export function useCreateTemplate(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: CreateTemplateInput) => createTemplate(organisationId, values),
    onSuccess: async (template) => {
      queryClient.setQueryData(templateQueryKeys.detail(organisationId, template.id), template);
      await queryClient.invalidateQueries({ queryKey: templateQueryKeys.list(organisationId) });
    },
  });
  return { ...mutation, isCreating: mutation.isPending };
}

// Rename / re-describe a template.
export function useUpdateTemplate(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ templateId, values }: { templateId: string; values: UpdateTemplateInput }) =>
      updateTemplate(organisationId, templateId, values),
    onSuccess: async (template) => {
      queryClient.setQueryData(templateQueryKeys.detail(organisationId, template.id), template);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: templateQueryKeys.list(organisationId) }),
        // Devices show their template's name.
        queryClient.invalidateQueries({ queryKey: deviceQueryKeys.all }),
      ]);
    },
  });
  return { ...mutation, isUpdating: mutation.isPending };
}

// Replace a template's parameters. Devices using it pick up the change automatically.
export function useReplaceTemplateParameters(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ templateId, parameters }: { templateId: string; parameters: TemplateParameterInput[] }) =>
      replaceTemplateParameters(organisationId, templateId, parameters),
    onSuccess: async (template) => {
      queryClient.setQueryData(templateQueryKeys.detail(organisationId, template.id), template);
      await queryClient.invalidateQueries({ queryKey: templateQueryKeys.list(organisationId) });
    },
  });
  return { ...mutation, isSavingParameters: mutation.isPending };
}

// Delete a template (only allowed when no devices use it).
export function useDeleteTemplate(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (templateId: string) => deleteTemplate(organisationId, templateId),
    onSuccess: async (_, templateId) => {
      queryClient.removeQueries({ queryKey: templateQueryKeys.detail(organisationId, templateId), exact: true });
      await queryClient.invalidateQueries({ queryKey: templateQueryKeys.list(organisationId) });
    },
  });
  return { ...mutation, isDeleting: mutation.isPending };
}

// Add a custom parameter to the organisation's catalogue.
export function useCreateMetricDefinition(organisationId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: CreateMetricDefinitionInput) => createMetricDefinition(organisationId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: templateQueryKeys.catalogue(organisationId) });
    },
  });
  return { ...mutation, isCreatingDefinition: mutation.isPending };
}
