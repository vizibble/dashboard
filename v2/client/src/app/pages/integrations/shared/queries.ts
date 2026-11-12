import { queryOptions } from '@tanstack/react-query';

import { getIntegrations } from '@/app/pages/integrations/shared/api';

/** Query definitions for integrations. User-scoped (not per organisation): ['integrations', ...]. */
export const integrationQueries = {
  all: () => ['integrations'] as const,
  overview: () =>
    queryOptions({
      queryKey: [...integrationQueries.all(), 'overview'] as const,
      queryFn: ({ signal }) => getIntegrations(signal),
    }),
};
