import { skipToken, useQuery } from '@tanstack/react-query';

import { templateQueries } from '@/app/pages/templates/shared/queries';

export function useFetchTemplates(organisationId: string) {
  const query = useQuery(templateQueries.list(organisationId));

  return query;
}

export function useFetchTemplate(organisationId: string, templateId: string | undefined) {
  const options = templateQueries.detail(organisationId, templateId ?? '');

  const query = useQuery({ ...options, queryFn: templateId ? options.queryFn : skipToken });

  return query;
}

export function useFetchMetricDefinitions(organisationId: string) {
  const query = useQuery(templateQueries.catalogue(organisationId));

  return query;
}
