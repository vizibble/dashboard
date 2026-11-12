import type { WhatsappConnection, WhatsappLinkCode } from '@vizibble/shared/integrations';
import { useEffect, useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import {
  useCreateWhatsappLinkCode,
  useUnlinkWhatsapp,
} from '@/app/pages/integrations/shared/hooks/use-integration-mutations';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

function useSecondsLeft(until: Date | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!until) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(timer);
  }, [until]);
  if (!until) {
    return 0;
  }

  return Math.max(0, Math.round((until.getTime() - now) / 1000));
}

/** Generating a single-use link code with its countdown, and unlinking a number behind a confirm. */
export function useWhatsappLinking(
  linkCode: WhatsappLinkCode | null,
  onLinkCode: (code: WhatsappLinkCode | null) => void,
) {
  const { organisation } = useOrganisationContext();

  const createCode = useCreateWhatsappLinkCode();

  const unlink = useUnlinkWhatsapp();

  const [pendingUnlink, setPendingUnlink] = useState<WhatsappConnection | null>(null);

  const secondsLeft = useSecondsLeft(linkCode?.expires_at);

  const expired = linkCode !== null && secondsLeft === 0;

  const startLinking = () =>
    createCode.mutate(organisation.id, {
      onSuccess: (code) => onLinkCode(code),
      onError: (error) =>
        toast({
          title: 'Could not start linking',
          description: getErrorMessage(error),
          variant: 'destructive',
        }),
    });

  const confirmUnlink = () => {
    if (!pendingUnlink) {
      return;
    }
    unlink.mutate(pendingUnlink.id, {
      onSuccess: () => {
        toast({
          title: 'WhatsApp unlinked',
          description: `${pendingUnlink.phone} can no longer use Vera.`,
        });
        setPendingUnlink(null);
      },
      onError: (error) =>
        toast({
          title: 'Could not unlink',
          description: getErrorMessage(error),
          variant: 'destructive',
        }),
    });
  };

  return {
    organisation,
    secondsLeft,
    expired,
    isCreatingCode: createCode.isPending,
    startLinking,
    cancelLinking: () => onLinkCode(null),
    pendingUnlink,
    requestUnlink: setPendingUnlink,
    cancelUnlink: () => setPendingUnlink(null),
    confirmUnlink,
    isUnlinking: unlink.isPending,
  };
}
