import { CheckIcon, CopyIcon, RobotIcon } from '@phosphor-icons/react';
import type { AiClientConnection } from '@vizibble/shared/integrations';
import { useState } from 'react';

import { useDisconnectAiClient } from '@/app/pages/integrations/shared/hooks/use-integrations';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';
import { Button } from '@/app/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/shared/components/ui/card';
import { toast } from '@/app/shared/hooks/use-toast';

type AiClientsCardProps = {
  mcpUrl: string;
  clients: AiClientConnection[];
};

function formatDate(date: Date | null) {
  return date
    ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Unknown date';
}

export function AiClientsCard({ mcpUrl, clients }: AiClientsCardProps) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<AiClientConnection | null>(null);
  const disconnect = useDisconnectAiClient();

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(mcpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', description: 'Select the address and copy it manually.' });
    }
  };

  const confirmDisconnect = () => {
    if (!pending) return;
    disconnect.mutate(pending.client_id, {
      onSuccess: () => {
        toast({ title: `${pending.name} disconnected`, description: 'It can no longer read your Vizibble data.' });
        setPending(null);
      },
      onError: (error) => toast({ title: 'Could not disconnect', description: error.message, variant: 'destructive' }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RobotIcon className="size-5" aria-hidden="true" />
          ChatGPT and Claude
        </CardTitle>
        <CardDescription>
          Ask about and manage your devices and telemetry from ChatGPT or Claude. They only reach what your role allows,
          can only make changes if you allow it when connecting, and ask before each change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium" id="mcp-url-label">
            Connector address
          </p>
          <div className="flex items-center gap-2">
            <code
              aria-labelledby="mcp-url-label"
              className="bg-muted min-w-0 flex-1 truncate rounded-md border px-3 py-2 font-mono text-sm"
            >
              {mcpUrl}
            </code>
            <Button variant="outline" size="sm" onClick={() => void copyUrl()}>
              {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">ChatGPT</p>
            <ol className="text-muted-foreground mt-1 list-decimal space-y-1 pl-5">
              <li>Settings → Apps &amp; Connectors → Create.</li>
              <li>Paste the connector address and choose OAuth.</li>
              <li>Sign in to Vizibble and allow access.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium">Claude</p>
            <ol className="text-muted-foreground mt-1 list-decimal space-y-1 pl-5">
              <li>Settings → Connectors → Add custom connector.</li>
              <li>Paste the connector address.</li>
              <li>Select Connect, then sign in and allow access.</li>
            </ol>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Connected apps</p>
          {clients.length === 0 ? (
            <p className="text-muted-foreground text-sm">No apps connected yet.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {clients.map((client) => (
                <li key={client.client_id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{client.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {client.scopes.includes('vizibble:write') ? 'Can read and make changes' : 'Read-only'} · connected{' '}
                      {formatDate(client.connected_at)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPending(client)}>
                    Disconnect
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={confirmDisconnect}
        title={`Disconnect ${pending?.name ?? 'this app'}?`}
        description="It loses access immediately. You can connect it again at any time."
        confirmLabel="Disconnect"
        destructive
        isPending={disconnect.isPending}
      />
    </Card>
  );
}
