import { PlugsConnectedIcon } from '@phosphor-icons/react';
import type { WhatsappLinkCode } from '@vizibble/shared/integrations';
import { useEffect, useRef, useState } from 'react';

import { AiClientsCard } from '@/app/pages/integrations/components/ai-clients-card';
import { WhatsappCard } from '@/app/pages/integrations/components/whatsapp-card';
import { useFetchIntegrations } from '@/app/pages/integrations/shared/hooks/use-integrations';
import { PageContainer } from '@/app/shared/components/layout/page-container';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { EmptyState } from '@/app/shared/components/states/empty-state';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { Skeleton } from '@/app/shared/components/ui/skeleton';
import { toast } from '@/app/shared/hooks/use-toast';

export function IntegrationsPage() {
  const [linkCode, setLinkCode] = useState<WhatsappLinkCode | null>(null);
  const { data, isPending, isError, refetch } = useFetchIntegrations(linkCode !== null);
  const knownLinks = useRef<Set<string> | null>(null);

  // A new linked number while a code is showing means the user just sent it.
  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.whatsapp.map((link) => link.id));
    if (linkCode && knownLinks.current && [...ids].some((id) => !knownLinks.current!.has(id))) {
      setLinkCode(null);
      toast({ title: 'WhatsApp linked', description: 'Say hello to Vera on WhatsApp.' });
    }
    knownLinks.current = ids;
  }, [data, linkCode]);

  return (
    <PageContainer size="narrow">
      <PageHeader title="Integrations" description="Connect AI assistants to your Vizibble data." />
      {isPending ? (
        <div className="space-y-6">
          <div className="bg-card space-y-4 rounded-lg border p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="bg-card space-y-4 rounded-lg border p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : isError ? (
        <div className="bg-card flex min-h-60 items-center justify-center rounded-lg border p-8">
          <ErrorState
            variant="inline"
            title="Couldn't load integrations"
            message="Check your connection and try again."
            onRetry={() => void refetch()}
          />
        </div>
      ) : !data.enabled || !data.mcp_url ? (
        <EmptyState
          icon={PlugsConnectedIcon}
          title="Integrations aren't enabled yet"
          description="Your administrator hasn't turned on AI integrations for this Vizibble deployment."
        />
      ) : (
        <div className="space-y-6">
          <AiClientsCard mcpUrl={data.mcp_url} clients={data.ai_clients} />
          <WhatsappCard
            whatsappNumber={data.whatsapp_number}
            connections={data.whatsapp}
            linkCode={linkCode}
            onLinkCode={setLinkCode}
          />
        </div>
      )}
    </PageContainer>
  );
}
