import { useQuery } from '@tanstack/react-query';

import { integrationQueries } from '@/app/pages/integrations/shared/queries';

const LINK_POLL_INTERVAL_MS = 4000;

/** Connections for the signed-in user. Polls while a WhatsApp code is waiting to be used. */
export function useIntegrations(pollWhileLinking: boolean) {
  return useQuery({
    ...integrationQueries.overview(),
    refetchInterval: pollWhileLinking ? LINK_POLL_INTERVAL_MS : false,
  });
}
