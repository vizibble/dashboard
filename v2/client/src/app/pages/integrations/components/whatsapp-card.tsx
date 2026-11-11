import { ChatCircleDotsIcon } from '@phosphor-icons/react';
import type { WhatsappConnection, WhatsappLinkCode } from '@vizibble/shared/integrations';
import { useEffect, useState } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useCreateWhatsappLinkCode, useUnlinkWhatsapp } from '@/app/pages/integrations/shared/hooks/use-integrations';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';
import { Button } from '@/app/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/shared/components/ui/card';
import { toast } from '@/app/shared/hooks/use-toast';

type WhatsappCardProps = {
  whatsappNumber: string | null;
  connections: WhatsappConnection[];
  /** The code being shown, lifted so the page can poll for the new link. */
  linkCode: WhatsappLinkCode | null;
  onLinkCode: (code: WhatsappLinkCode | null) => void;
};

function useSecondsLeft(until: Date | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);
  return until ? Math.max(0, Math.round((until.getTime() - now) / 1000)) : 0;
}

export function WhatsappCard({ whatsappNumber, connections, linkCode, onLinkCode }: WhatsappCardProps) {
  const { organisation } = useOrganisationContext();
  const createCode = useCreateWhatsappLinkCode();
  const unlink = useUnlinkWhatsapp();
  const [pendingUnlink, setPendingUnlink] = useState<WhatsappConnection | null>(null);
  const secondsLeft = useSecondsLeft(linkCode?.expires_at);
  const expired = linkCode !== null && secondsLeft === 0;

  const start = () =>
    createCode.mutate(organisation.id, {
      onSuccess: (code) => onLinkCode(code),
      onError: (error) =>
        toast({ title: 'Could not start linking', description: error.message, variant: 'destructive' }),
    });

  const confirmUnlink = () => {
    if (!pendingUnlink) return;
    unlink.mutate(pendingUnlink.id, {
      onSuccess: () => {
        toast({ title: 'WhatsApp unlinked', description: `${pendingUnlink.phone} can no longer use Vera.` });
        setPendingUnlink(null);
      },
      onError: (error) => toast({ title: 'Could not unlink', description: error.message, variant: 'destructive' }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChatCircleDotsIcon className="size-5" aria-hidden="true" />
          WhatsApp
        </CardTitle>
        <CardDescription>
          Message Vera, Vizibble&apos;s assistant, from WhatsApp. Your number only works after you link it here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!whatsappNumber ? (
          <p className="text-muted-foreground text-sm">WhatsApp isn&apos;t available on this deployment yet.</p>
        ) : linkCode && !expired ? (
          <div className="space-y-3 rounded-md border p-4" aria-live="polite">
            <p className="text-sm">
              Send this message to <span className="font-medium">{linkCode.whatsapp_number}</span> from the phone you
              want to link:
            </p>
            <p className="bg-muted rounded-md px-3 py-2 text-center font-mono text-lg tracking-wider">
              {linkCode.message}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild>
                <a href={linkCode.whatsapp_url} target="_blank" rel="noreferrer">
                  Open WhatsApp
                </a>
              </Button>
              <Button variant="outline" onClick={() => onLinkCode(null)}>
                Cancel
              </Button>
              <span className="text-muted-foreground text-xs">
                Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}. Single use.
              </span>
            </div>
            <p className="text-muted-foreground text-xs">This page updates by itself once the number is linked.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expired && <p className="text-sm">That code expired. Create a new one to try again.</p>}
            <Button onClick={start} loading={createCode.isPending}>
              {connections.length > 0 ? 'Link another number' : 'Connect WhatsApp'}
            </Button>
            <p className="text-muted-foreground text-xs">
              Vera will answer about <span className="font-medium">{organisation.name}</span> by default. You can ask
              about your other organisations in the chat.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Linked numbers</p>
          {connections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No numbers linked.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {connections.map((connection) => (
                <li key={connection.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono text-sm">{connection.phone}</p>
                    <p className="text-muted-foreground text-xs">
                      {connection.organisation_name ?? 'No default organisation'} · linked{' '}
                      {connection.linked_at.toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPendingUnlink(connection)}>
                    Unlink
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={pendingUnlink !== null}
        onClose={() => setPendingUnlink(null)}
        onConfirm={confirmUnlink}
        title="Unlink this number?"
        description={`${pendingUnlink?.phone ?? 'This number'} stops working with Vera immediately.`}
        confirmLabel="Unlink"
        destructive
        isPending={unlink.isPending}
      />
    </Card>
  );
}
