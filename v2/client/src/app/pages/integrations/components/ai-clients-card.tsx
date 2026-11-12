import { CheckIcon, CopyIcon, RobotIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import type { AiClientConnection } from '@vizibble/shared/integrations';

import { useAiClients } from '@/app/pages/integrations/shared/hooks/use-ai-clients';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';
import { Button } from '@/app/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/shared/components/ui/card';

type AiClientsCardProps = {
  mcpUrl: string;
  clients: AiClientConnection[];
};

function formatDate(date: Date | null) {
  if (!date) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function AiClientsCard({ mcpUrl, clients }: AiClientsCardProps) {
  const {
    copied,
    copyUrl,
    pending,
    requestDisconnect,
    cancelDisconnect,
    confirmDisconnect,
    isDisconnecting,
  } = useAiClients(mcpUrl);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
            <RobotIcon className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 space-y-1">
            <CardTitle>AI assistants</CardTitle>
            <CardDescription>ChatGPT and Claude</CardDescription>
          </div>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Connect AI assistants to interact with your devices and telemetry using natural language. Access is
          governed by your organisation permissions and the permissions granted during connection.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connector address */}
        <section aria-labelledby="connector-address-heading" className="space-y-2.5">
          <div className="space-y-1">
            <h3 id="connector-address-heading" className="text-sm font-medium">
              Connector address
            </h3>
            <p className="text-muted-foreground text-xs">Use this address when adding a custom connector.</p>
          </div>

          <div className="bg-muted/40 flex min-w-0 items-center gap-2 rounded-lg border p-2">
            <code className="min-w-0 flex-1 truncate px-1 font-mono text-xs sm:text-sm">{mcpUrl}</code>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => void copyUrl()}
              aria-label={copied ? 'Connector address copied' : 'Copy connector address'}
            >
              {copied ? (
                <CheckIcon className="size-4" aria-hidden="true" />
              ) : (
                <CopyIcon className="size-4" aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </section>

        {/* Setup instructions */}
        <section aria-labelledby="setup-heading" className="space-y-3">
          <div className="space-y-1">
            <h3 id="setup-heading" className="text-sm font-medium">
              Setup instructions
            </h3>
            <p className="text-muted-foreground text-xs">
              Follow the steps for the AI assistant you want to connect.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3.5">
              <p className="text-sm font-medium">ChatGPT</p>
              <ol className="text-muted-foreground mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed">
                <li>Open Settings → Apps &amp; Connectors.</li>
                <li>Select Create and paste the connector address.</li>
                <li>Choose OAuth, then sign in and authorize access.</li>
              </ol>
            </div>

            <div className="rounded-lg border p-3.5">
              <p className="text-sm font-medium">Claude</p>
              <ol className="text-muted-foreground mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed">
                <li>Open Settings → Connectors.</li>
                <li>Select Add custom connector and paste the address.</li>
                <li>Connect, then sign in and authorize access.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Access information */}
        <div className="bg-muted/40 flex items-start gap-3 rounded-lg border p-3.5">
          <ShieldCheckIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Access and permissions</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Connected assistants can only access information permitted by your role. Write access depends on
              the permissions granted during authorization, and changes require confirmation.
            </p>
          </div>
        </div>

        {/* Connected applications */}
        <section aria-labelledby="connected-apps-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 id="connected-apps-heading" className="text-sm font-medium">
                Connected applications
              </h3>
              <p className="text-muted-foreground text-xs">
                Manage applications that have access to your organisation.
              </p>
            </div>

            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {clients.length} {clients.length === 1 ? 'connection' : 'connections'}
            </span>
          </div>

          {clients.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center">
              <RobotIcon className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
              <p className="mt-2 text-sm font-medium">No connected applications</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Applications you authorize will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {clients.map((client) => {
                const hasWriteAccess = client.scopes.includes('vizibble:write');

                return (
                  <li key={client.client_id} className="flex items-center justify-between gap-3 p-3.5">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                        <RobotIcon className="text-muted-foreground size-4" aria-hidden="true" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium">{client.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {hasWriteAccess ? 'Read and write access' : 'Read-only access'}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Connected {formatDate(client.connected_at)}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => requestDisconnect(client)}
                    >
                      Disconnect
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </CardContent>

      <ConfirmDialog
        open={pending !== null}
        onClose={cancelDisconnect}
        onConfirm={confirmDisconnect}
        title={`Disconnect ${pending?.name ?? 'this application'}?`}
        description="This application will immediately lose access to your organisation. You can authorize it again at any time."
        confirmLabel="Disconnect"
        destructive
        isPending={isDisconnecting}
      />
    </Card>
  );
}
