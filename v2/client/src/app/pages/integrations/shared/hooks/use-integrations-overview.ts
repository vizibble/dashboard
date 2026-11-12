import type { WhatsappLinkCode } from '@vizibble/shared/integrations';
import { useEffect, useRef, useState } from 'react';

import { useIntegrations } from '@/app/pages/integrations/shared/hooks/use-integration-queries';
import { toast } from '@/app/shared/hooks/use-toast';

/**
 * Loads the overview and owns the WhatsApp code being shown. While a code is showing the overview
 * polls; a newly linked number means the user just sent the code, so it is cleared.
 */
export function useIntegrationsOverview() {
  const [linkCode, setLinkCode] = useState<WhatsappLinkCode | null>(null);

  const query = useIntegrations(linkCode !== null);

  const knownLinks = useRef<Set<string> | null>(null);

  const { data } = query;

  useEffect(() => {
    if (!data) {
      return;
    }
    const ids = new Set(data.whatsapp.map((link) => link.id));

    const previous = knownLinks.current;

    knownLinks.current = ids;
    if (!linkCode || !previous) {
      return;
    }
    if (![...ids].some((id) => !previous.has(id))) {
      return;
    }
    setLinkCode(null);
    toast({
      title: 'WhatsApp linked',
      description: 'Say hello to Vera on WhatsApp.',
    });
  }, [data, linkCode]);

  return { query, linkCode, setLinkCode };
}
