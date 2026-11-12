import {
  ChatCircleDotsIcon,
  ClockIcon,
  LinkIcon,
  ShieldCheckIcon,
  WhatsappLogoIcon,
} from '@phosphor-icons/react';
import type { WhatsappConnection, WhatsappLinkCode } from '@vizibble/shared/integrations';

import { useWhatsappLinking } from '@/app/pages/integrations/shared/hooks/use-whatsapp-linking';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';
import { Button } from '@/app/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/shared/components/ui/card';

type WhatsappCardProps = {
  whatsappNumber: string | null;
  connections: WhatsappConnection[];
  /** The code being shown, lifted so the page can poll for the new link. */
  linkCode: WhatsappLinkCode | null;
  onLinkCode: (code: WhatsappLinkCode | null) => void;
};

type WhatsappLinking = ReturnType<typeof useWhatsappLinking>;

type LinkSectionProps = {
  whatsappNumber: string | null;
  hasConnections: boolean;
  linkCode: WhatsappLinkCode | null;
  linking: WhatsappLinking;
};

function formatExpiry(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function LinkSection({ whatsappNumber, hasConnections, linkCode, linking }: LinkSectionProps) {
  if (!whatsappNumber) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
        <ChatCircleDotsIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-medium">WhatsApp is unavailable</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            WhatsApp integration hasn&apos;t been configured for this deployment yet.
          </p>
        </div>
      </div>
    );
  }

  if (linkCode && !linking.expired) {
    return (
      <section
        aria-labelledby="whatsapp-link-heading"
        aria-live="polite"
        className="space-y-4 rounded-lg border p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 id="whatsapp-link-heading" className="text-sm font-medium">
              Complete your WhatsApp connection
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Send the message below from the phone number you want to link.
            </p>
          </div>

          <div className="bg-muted flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5">
            <ClockIcon className="text-muted-foreground size-3.5" aria-hidden="true" />
            <span className="font-mono text-xs tabular-nums">{formatExpiry(linking.secondsLeft)}</span>
          </div>
        </div>

        <div className="bg-muted/40 space-y-2 rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Send this message to</p>
          <p className="text-sm font-medium">{linkCode.whatsapp_number}</p>
          <p className="bg-background rounded-md border px-3 py-3 text-center font-mono text-sm font-medium tracking-wide">
            {linkCode.message}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <a href={linkCode.whatsapp_url} target="_blank" rel="noopener noreferrer">
              <WhatsappLogoIcon className="size-4" aria-hidden="true" />
              Open WhatsApp
            </a>
          </Button>

          <Button type="button" variant="outline" onClick={linking.cancelLinking}>
            Cancel
          </Button>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          This code is valid for a limited time and can only be used once. This page will update automatically
          after your number is linked.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="whatsapp-connect-heading" className="space-y-3">
      <div className="space-y-1">
        <h3 id="whatsapp-connect-heading" className="text-sm font-medium">
          {hasConnections ? 'Connect another number' : 'Connect your WhatsApp number'}
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Generate a secure linking code to connect your personal WhatsApp number.
        </p>
      </div>

      {linking.expired && (
        <p className="text-muted-foreground rounded-md border px-3 py-2 text-xs" role="status">
          Your previous linking code has expired. Generate a new one to continue.
        </p>
      )}

      <Button onClick={linking.startLinking} loading={linking.isCreatingCode}>
        <LinkIcon className="size-4" aria-hidden="true" />
        {hasConnections ? 'Link another number' : 'Connect WhatsApp'}
      </Button>

      <div className="bg-muted/40 flex items-start gap-2.5 rounded-lg border p-3">
        <ShieldCheckIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Messages are handled by Vera, Vizibble&apos;s assistant. Your default organisation is{' '}
          <span className="text-foreground font-medium">{linking.organisation.name}</span>. You can also ask
          about your other organisations in the conversation.
        </p>
      </div>
    </section>
  );
}

function LinkedNumbers({
  connections,
  linking,
}: {
  connections: WhatsappConnection[];
  linking: WhatsappLinking;
}) {
  return (
    <section aria-labelledby="linked-numbers-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 id="linked-numbers-heading" className="text-sm font-medium">
            Linked numbers
          </h3>
          <p className="text-muted-foreground text-xs">Manage the phone numbers connected to Vera.</p>
        </div>

        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {connections.length} {connections.length === 1 ? 'number' : 'numbers'}
        </span>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center">
          <ChatCircleDotsIcon className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium">No linked numbers</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Your connected WhatsApp numbers will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {connections.map((connection) => (
            <li key={connection.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                  <WhatsappLogoIcon className="text-muted-foreground size-4" aria-hidden="true" />
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="truncate font-mono text-sm font-medium">{connection.phone}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {connection.organisation_name ?? 'No default organisation'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Linked{' '}
                    {connection.linked_at.toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => linking.requestUnlink(connection)}
              >
                Unlink
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function WhatsappCard({ whatsappNumber, connections, linkCode, onLinkCode }: WhatsappCardProps) {
  const linking = useWhatsappLinking(linkCode, onLinkCode);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
            <ChatCircleDotsIcon className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 space-y-1">
            <CardTitle>WhatsApp</CardTitle>
            <CardDescription>Connect with Vera</CardDescription>
          </div>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Message Vera, Vizibble&apos;s assistant, directly from WhatsApp to access information about your
          devices, telemetry, and organisation.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <LinkSection
          whatsappNumber={whatsappNumber}
          hasConnections={connections.length > 0}
          linkCode={linkCode}
          linking={linking}
        />

        <LinkedNumbers connections={connections} linking={linking} />
      </CardContent>

      <ConfirmDialog
        open={linking.pendingUnlink !== null}
        onClose={linking.cancelUnlink}
        onConfirm={linking.confirmUnlink}
        title="Unlink this number?"
        description={`${linking.pendingUnlink?.phone ?? 'This number'} will immediately lose access to Vera. You can link it again at any time.`}
        confirmLabel="Unlink"
        destructive
        isPending={linking.isUnlinking}
      />
    </Card>
  );
}
