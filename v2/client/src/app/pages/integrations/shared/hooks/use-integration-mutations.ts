import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createWhatsappLinkCode,
  disconnectAiClient,
  unlinkWhatsapp,
} from '@/app/pages/integrations/shared/api';
import { integrationQueries } from '@/app/pages/integrations/shared/queries';

export function useCreateWhatsappLinkCode() {
  return useMutation({ mutationFn: (organisationId: string) => createWhatsappLinkCode(organisationId) });
}

export function useUnlinkWhatsapp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (grantId: string) => unlinkWhatsapp(grantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: integrationQueries.overview().queryKey }),
  });
}

export function useDisconnectAiClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => disconnectAiClient(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: integrationQueries.overview().queryKey }),
  });
}
