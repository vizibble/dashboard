import { queryOptions } from '@tanstack/react-query';

import { getMetricDefinitions, getTemplate, getTemplates } from '@/app/pages/templates/shared/api';

/** Query definitions for templates. Keys: ['templates', organisationId, scope, ...params]. */
export const templateQueries = {
  all: (organisationId: string) => ['templates', organisationId] as const,
  list: (organisationId: string) =>
    queryOptions({
      queryKey: [...templateQueries.all(organisationId), 'list'] as const,
      queryFn: ({ signal }) => getTemplates(organisationId, signal),
    }),
  detail: (organisationId: string, templateId: string) =>
    queryOptions({
      queryKey: [...templateQueries.all(organisationId), 'detail', templateId] as const,
      queryFn: ({ signal }) => getTemplate(organisationId, templateId, signal),
    }),
  /** The parameter catalogue: built-in definitions plus the organisation's own. */
  catalogue: (organisationId: string) =>
    queryOptions({
      queryKey: [...templateQueries.all(organisationId), 'catalogue'] as const,
      queryFn: ({ signal }) => getMetricDefinitions(organisationId, signal),
      staleTime: 5 * 60_000,
    }),
};
