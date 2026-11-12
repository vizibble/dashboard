import { EnvelopeSimpleIcon } from '@phosphor-icons/react';
import { roleLabels } from '@vizibble/shared/permissions';

import type { MemberAccess } from '@/app/pages/(organisation)/members/hooks/use-member-access';
import { canResendInvitation } from '@/app/pages/(organisation)/members/lib/members';
import type { Invitation } from '@/app/pages/(organisation)/members/types';
import { primaryRole } from '@/app/pages/(organisation)/shared/lib/roles';
import { DataTable, type DataTableColumn } from '@/app/shared/components/data-table';
import { EmptyState } from '@/app/shared/components/states/empty-state';
import { Badge } from '@/app/shared/components/ui/badge';
import { Button } from '@/app/shared/components/ui/button';

type InvitationsSectionProps = {
  access: MemberAccess;
  invitations: Invitation[];
  onResend: (invitation: Invitation) => void;
  onCancel: (invitation: Invitation) => void;
  isResending: boolean;
  isCancelling: boolean;
};

export function InvitationsSection({
  access,
  invitations,
  onResend,
  onCancel,
  isResending,
  isCancelling,
}: InvitationsSectionProps) {
  const { canInvite, canCancel, isOwner } = access;

  const columns: DataTableColumn<Invitation>[] = [
    {
      id: 'email',
      header: 'Email',
      cell: (invitation) => <span className="font-medium">{invitation.email}</span>,
    },
    {
      id: 'role',
      header: 'Role',
      className: 'w-32',
      cell: (invitation) => (
        <Badge variant="secondary">{roleLabels[primaryRole(invitation.role ?? 'member')]}</Badge>
      ),
    },
    {
      id: 'expires',
      header: 'Expires',
      className: 'w-32 hidden sm:table-cell',
      cell: (invitation) => new Date(invitation.expiresAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-44 text-right',
      cell: (invitation) => (
        <div className="flex justify-end gap-1">
          {canResendInvitation({
            canInvite,
            invitationRole: invitation.role ?? 'member',
            viewerIsOwner: isOwner,
          }) && (
            <Button variant="ghost" size="sm" disabled={isResending} onClick={() => onResend(invitation)}>
              Resend
            </Button>
          )}
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              disabled={isCancelling}
              onClick={() => onCancel(invitation)}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <section aria-labelledby="pending-invitations" className="space-y-3">
      <h2 id="pending-invitations" className="text-sm font-semibold">
        Pending invitations
      </h2>
      <div className="bg-card rounded-lg border">
        {invitations.length === 0 ? (
          <EmptyState
            icon={EnvelopeSimpleIcon}
            title="No pending invitations"
            description="Invitations you send appear here until they're accepted or expire."
          />
        ) : (
          <DataTable columns={columns} rows={invitations} getRowId={(invitation) => invitation.id} />
        )}
      </div>
    </section>
  );
}
