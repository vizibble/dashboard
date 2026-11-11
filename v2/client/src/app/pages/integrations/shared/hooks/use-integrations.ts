import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createWhatsappLinkCode,
  disconnectAiClient,
  getIntegrations,
  unlinkWhatsapp,
} from '@/app/pages/integrations/shared/api';

export const integrationQueryKeys = {
  overview: ['integrations', 'overview'] as const,
};

/** Connections for the signed-in user. Polls while a WhatsApp code is waiting to be used. */
export function useFetchIntegrations(pollWhileLinking: boolean) {
  return useQuery({
    queryKey: integrationQueryKeys.overview,
    queryFn: ({ signal }) => getIntegrations(signal),
    refetchInterval: pollWhileLinking ? 4000 : false,
  });
}

export function useCreateWhatsappLinkCode() {
  return useMutation({ mutationFn: (organisationId: string) => createWhatsappLinkCode(organisationId) });
}

export function useUnlinkWhatsapp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grantId: string) => unlinkWhatsapp(grantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: integrationQueryKeys.overview }),
  });
}

export function useDisconnectAiClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => disconnectAiClient(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: integrationQueryKeys.overview }),
  });
}
