import { EnvelopeSimpleIcon, PlusIcon, UsersThreeIcon } from '@phosphor-icons/react';
import {
  assignableRoles,
  roleLabels,
  statements,
  type AssignableRole,
  type RoleName,
} from '@vizibble/shared/permissions';
import { useMemo, useState } from 'react';

import { authClient } from '@/app/pages/(auth)/client';
import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { InviteMemberDialog } from '@/app/pages/(organisation)/members/components/invite-member-dialog';
import { RoleSelect } from '@/app/pages/(organisation)/members/components/role-select';
import {
  useCancelInvitation,
  useFetchInvitations,
  useFetchMembers,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
} from '@/app/pages/(organisation)/members/hooks/use-members';
import { usePermissions } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { ConfirmDialog } from '@/app/shared/components/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/app/shared/components/data-table';
import { ListMessage, ListNoMatch, ListView } from '@/app/shared/components/layout/list-view';
import { PageContainer } from '@/app/shared/components/layout/page-container';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { EmptyState } from '@/app/shared/components/states/empty-state';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { TableSkeleton } from '@/app/shared/components/states/table-skeleton';
import { Badge } from '@/app/shared/components/ui/badge';
import { Button } from '@/app/shared/components/ui/button';
import { toast } from '@/app/shared/hooks/use-toast';

type Member = ReturnType<typeof useFetchMembers>['members'][number];
type Invitation = ReturnType<typeof useFetchInvitations>['invitations'][number];

const OWNER = 'owner';

function hasRole(role: string, name: RoleName) {
  return role.split(',').some((item) => item.trim() === name);
}

/** The first assignable role in a (possibly comma-separated) Better Auth role string. */
function primaryRole(role: string): AssignableRole {
  const names = role.split(',').map((item) => item.trim());
  if (names.includes('member')) return 'viewer';
  return assignableRoles.find((item) => names.includes(item)) ?? 'viewer';
}

function describeError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Something went wrong. Please try again.';
}

const RESOURCE_LABELS: Partial<Record<keyof typeof statements, string>> = {
  organization: 'Organisation',
  member: 'Members',
  invitation: 'Invitations',
  settings: 'Settings',
  location: 'Locations',
  device: 'Devices',
  template: 'Templates',
  telemetry: 'Telemetry',
  dashboard: 'Dashboards',
  report: 'Reports',
};

export function MembersPage() {
  const { role: myRole } = useOrganisationContext();
  const { can } = usePermissions();
  const { data: session } = authClient.useSession();
  const myUserId = session?.user.id;

  const canInvite = can({ invitation: ['create'] });
  const canCancel = can({ invitation: ['cancel'] });
  const canChangeRoles = can({ member: ['update'] });
  const canRemove = can({ member: ['delete'] });
  const isOwner = hasRole(myRole, OWNER);
  // Only owners may grant or edit the owner role; Better Auth enforces the same rule.
  const grantableRoles = isOwner ? assignableRoles : assignableRoles.filter((role) => role !== OWNER);

  const { members, isLoading, isFetching, isError, refetch } = useFetchMembers();
  const { invitations } = useFetchInvitations(canInvite || canCancel);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const cancelInvitation = useCancelInvitation();
  const resendInvitation = useInviteMember();

  const [search, setSearch] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [roleChange, setRoleChange] = useState<{ member: Member; role: AssignableRole } | null>(null);

  const ownerCount = members.filter((member) => hasRole(member.role, OWNER)).length;

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter(
      (member) =>
        member.user.name.toLowerCase().includes(query) ||
        member.user.email.toLowerCase().includes(query) ||
        roleLabels[primaryRole(member.role)].toLowerCase().includes(query),
    );
  }, [members, search]);

  const confirmRoleChange = async () => {
    if (!roleChange) return;
    try {
      await updateRole.mutateAsync({ memberId: roleChange.member.id, role: roleChange.role });
      toast({
        variant: 'success',
        title: 'Role updated',
        description: `${roleChange.member.user.name} is now ${roleLabels[roleChange.role].toLowerCase()}.`,
      });
      setRoleChange(null);
    } catch (cause: unknown) {
      toast({ variant: 'destructive', title: 'Unable to change role', description: describeError(cause) });
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await removeMember.mutateAsync(removing.id);
      toast({
        variant: 'success',
        title: 'Member removed',
        description: `${removing.user.name} no longer has access.`,
      });
      setRemoving(null);
    } catch (cause: unknown) {
      toast({ variant: 'destructive', title: 'Unable to remove member', description: describeError(cause) });
    }
  };

  const resend = async (invitation: Invitation) => {
    try {
      await resendInvitation.mutateAsync({
        email: invitation.email,
        role: primaryRole(invitation.role ?? 'viewer'),
        resend: true,
      });
      toast({ variant: 'success', title: 'Invitation resent', description: `We emailed ${invitation.email} again.` });
    } catch (cause: unknown) {
      toast({ variant: 'destructive', title: 'Unable to resend invitation', description: describeError(cause) });
    }
  };

  const cancel = async (invitation: Invitation) => {
    try {
      await cancelInvitation.mutateAsync(invitation.id);
      toast({
        variant: 'success',
        title: 'Invitation cancelled',
        description: `${invitation.email} can no longer join.`,
      });
    } catch (cause: unknown) {
      toast({ variant: 'destructive', title: 'Unable to cancel invitation', description: describeError(cause) });
    }
  };

  const memberColumns: DataTableColumn<Member>[] = [
    {
      id: 'name',
      header: 'Member',
      cell: (member) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {member.user.name}
            {member.userId === myUserId && <span className="text-muted-foreground font-normal"> (you)</span>}
          </p>
          <p className="text-muted-foreground truncate text-xs">{member.user.email}</p>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      className: 'w-56',
      cell: (member) => {
        const current = primaryRole(member.role);
        const isSelf = member.userId === myUserId;
        const targetIsOwner = hasRole(member.role, OWNER);
        // Self-changes go through ownership transfer (another owner) only; Better Auth
        // also blocks non-owners from touching owners and demoting the last owner.
        const editable = canChangeRoles && !isSelf && (isOwner || !targetIsOwner);
        if (!editable) return <Badge variant="secondary">{roleLabels[current]}</Badge>;
        return (
          <RoleSelect
            aria-label={`Role for ${member.user.name}`}
            value={current}
            roles={grantableRoles}
            className="h-8 w-44"
            onChange={(role) => role !== current && setRoleChange({ member, role })}
          />
        );
      },
    },
    {
      id: 'joined',
      header: 'Joined',
      className: 'w-32 hidden sm:table-cell',
      cell: (member) => new Date(member.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-28 text-right',
      cell: (member) => {
        const isLastOwner = hasRole(member.role, OWNER) && ownerCount <= 1;
        if (!canRemove || member.userId === myUserId || isLastOwner) return null;
        if (hasRole(member.role, OWNER) && !isOwner) return null;
        return (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRemoving(member)}>
            Remove
          </Button>
        );
      },
    },
  ];

  const invitationColumns: DataTableColumn<Invitation>[] = [
    { id: 'email', header: 'Email', cell: (invitation) => <span className="font-medium">{invitation.email}</span> },
    {
      id: 'role',
      header: 'Role',
      className: 'w-32',
      cell: (invitation) => <Badge variant="secondary">{roleLabels[primaryRole(invitation.role ?? 'viewer')]}</Badge>,
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
          {canInvite && (isOwner || primaryRole(invitation.role ?? 'viewer') !== OWNER) && (
            <Button
              variant="ghost"
              size="sm"
              disabled={resendInvitation.isPending}
              onClick={() => void resend(invitation)}
            >
              Resend
            </Button>
          )}
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              disabled={cancelInvitation.isPending}
              onClick={() => void cancel(invitation)}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  const memberSkeletonColumns = [
    { id: 'member', header: 'Member', skeletonClassName: 'w-40' },
    { id: 'role', header: 'Role', className: 'w-56', skeletonClassName: 'w-24' },
    { id: 'joined', header: 'Joined', className: 'w-32 hidden sm:table-cell', skeletonClassName: 'w-20' },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-28 text-right',
      skeletonClassName: 'w-16 ml-auto',
    },
  ];

  const content = isLoading ? (
    <TableSkeleton columns={memberSkeletonColumns} rowCount={4} />
  ) : isError ? (
    <ListMessage>
      <ErrorState
        title="Could not load members"
        message="We couldn't retrieve your organisation's members. Please try again."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    </ListMessage>
  ) : visibleMembers.length === 0 ? (
    <ListNoMatch query={search} onClear={() => setSearch('')} />
  ) : (
    <DataTable columns={memberColumns} rows={visibleMembers} getRowId={(member) => member.id} />
  );

  const makingOwner = roleChange && roleChange.role === OWNER;

  return (
    <PageContainer>
      <PageHeader
        title="Members"
        description="People in your organisation and what they can do."
        actions={
          canInvite && (
            <Button size="sm" onClick={() => setInviting(true)}>
              <PlusIcon /> Invite member
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <MyAccess role={myRole} />

        <ListView
          search={{ value: search, onChange: setSearch, placeholder: 'Search by name, email or role…' }}
          count={{ shown: visibleMembers.length, total: members.length }}
          isRefetching={!isLoading && isFetching}
        >
          {content}
        </ListView>

        {(canInvite || canCancel) && (
          <section aria-labelledby="pending-invitations" className="space-y-3">
            <h2 id="pending-invitations" className="text-sm font-semibold">
              Pending invitations
            </h2>
            {invitations.length === 0 ? (
              <div className="bg-card rounded-lg border">
                <EmptyState
                  icon={EnvelopeSimpleIcon}
                  title="No pending invitations"
                  description="Invitations you send appear here until they're accepted or expire."
                />
              </div>
            ) : (
              <div className="bg-card rounded-lg border">
                <DataTable columns={invitationColumns} rows={invitations} getRowId={(invitation) => invitation.id} />
              </div>
            )}
          </section>
        )}
      </div>

      <InviteMemberDialog open={inviting} onClose={() => setInviting(false)} roles={grantableRoles} />

      <ConfirmDialog
        open={Boolean(roleChange)}
        onClose={() => setRoleChange(null)}
        onConfirm={() => void confirmRoleChange()}
        title={makingOwner ? 'Make this member an owner?' : 'Change role?'}
        description={
          makingOwner
            ? `${roleChange?.member.user.name} will get full control, including deleting the organisation. To hand over ownership, make them an owner, then ask them to change your role.`
            : `${roleChange?.member.user.name} will become ${roleChange ? roleLabels[roleChange.role].toLowerCase() : ''}. Their access changes immediately.`
        }
        confirmLabel={makingOwner ? 'Make owner' : 'Change role'}
        isPending={updateRole.isPending}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={() => void confirmRemove()}
        title="Remove member?"
        description={`${removing?.user.name} will lose access to this organisation immediately.`}
        confirmLabel="Remove member"
        destructive
        isPending={removeMember.isPending}
      />
    </PageContainer>
  );
}

/** The signed-in member's role and what it allows, derived from the shared definitions. */
function MyAccess({ role }: { role: string }) {
  const { can } = usePermissions();
  const rows = (Object.keys(RESOURCE_LABELS) as (keyof typeof statements)[])
    .map((resource) => ({
      resource,
      actions: statements[resource].filter((action) => can({ [resource]: [action] })),
    }))
    .filter((row) => row.actions.length > 0);

  return (
    <section aria-labelledby="my-access" className="bg-card rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <UsersThreeIcon aria-hidden="true" className="text-muted-foreground size-5" />
        <h2 id="my-access" className="text-sm font-semibold">
          Your access
        </h2>
        <Badge>{roleLabels[primaryRole(role)]}</Badge>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {rows.map(({ resource, actions }) => (
          <div key={resource} className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">{RESOURCE_LABELS[resource]}</dt>
            <dd>{actions.join(', ')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
