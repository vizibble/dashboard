import type { AiClientConnection } from '@vizibble/shared/integrations';
import { useState } from 'react';

import { useDisconnectAiClient } from '@/app/pages/integrations/shared/hooks/use-integration-mutations';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

const COPIED_RESET_MS = 2000;

/** Copying the connector address, and disconnecting an app behind a confirm. */
export function useAiClients(mcpUrl: string) {
  const [copied, setCopied] = useState(false);

  const [pending, setPending] = useState<AiClientConnection | null>(null);

  const disconnect = useDisconnectAiClient();

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(mcpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Select the address and copy it manually.',
      });
    }
  };

  const confirmDisconnect = () => {
    if (!pending) {
      return;
    }
    disconnect.mutate(pending.client_id, {
      onSuccess: () => {
        toast({
          title: `${pending.name} disconnected`,
          description: 'It can no longer read your Vizibble data.',
        });
        setPending(null);
      },
      onError: (error) =>
        toast({
          title: 'Could not disconnect',
          description: getErrorMessage(error),
          variant: 'destructive',
        }),
    });
  };

  return {
    copied,
    copyUrl,
    pending,
    requestDisconnect: setPending,
    cancelDisconnect: () => setPending(null),
    confirmDisconnect,
    isDisconnecting: disconnect.isPending,
  };
}
