import { roleLabels } from '@vizibble/shared/permissions';

import { RoleSelect } from '@/app/pages/(organisation)/members/components/role-select';
import type { MemberAccess } from '@/app/pages/(organisation)/members/hooks/use-member-access';
import type { RoleChange } from '@/app/pages/(organisation)/members/hooks/use-member-actions';
import { canEditMemberRole, canRemoveMember } from '@/app/pages/(organisation)/members/lib/members';
import type { Member } from '@/app/pages/(organisation)/members/types';
import { primaryRole } from '@/app/pages/(organisation)/shared/lib/roles';
import { DataTable, type DataTableColumn } from '@/app/shared/components/data-table';
import { ListMessage, ListNoMatch } from '@/app/shared/components/layout/list-view';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { TableSkeleton } from '@/app/shared/components/states/table-skeleton';
import { Badge } from '@/app/shared/components/ui/badge';
import { Button } from '@/app/shared/components/ui/button';

const memberSkeletonColumns = [
  { id: 'member', header: 'Member', skeletonClassName: 'w-40' },
  { id: 'role', header: 'Role', className: 'w-56', skeletonClassName: 'w-24' },
  {
    id: 'joined',
    header: 'Joined',
    className: 'w-32 hidden sm:table-cell',
    skeletonClassName: 'w-20',
  },
  {
    id: 'actions',
    header: <span className="sr-only">Actions</span>,
    className: 'w-28 text-right',
    skeletonClassName: 'w-16 ml-auto',
  },
];

type MembersTableProps = {
  access: MemberAccess;
  members: Member[];
  ownerCount: number;
  search: string;
  onClearSearch: () => void;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
  onRoleChange: (change: RoleChange) => void;
  onRemove: (member: Member) => void;
};

/** The members list with its loading, error and no-match states. */
export function MembersTable({
  access,
  members,
  ownerCount,
  search,
  onClearSearch,
  isLoading,
  isError,
  isFetching,
  onRetry,
  onRoleChange,
  onRemove,
}: MembersTableProps) {
  if (isLoading) {
    return <TableSkeleton columns={memberSkeletonColumns} rowCount={4} />;
  }

  if (isError) {
    return (
      <ListMessage>
        <ErrorState
          title="Could not load members"
          message="We couldn't retrieve your organisation's members. Please try again."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      </ListMessage>
    );
  }

  if (members.length === 0) {
    return <ListNoMatch query={search} onClear={onClearSearch} />;
  }

  const { myUserId, isOwner, canChangeRoles, canRemove, grantableRoles } = access;

  const columns: DataTableColumn<Member>[] = [
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

        const editable = canEditMemberRole({
          canChangeRoles,
          isSelf: member.userId === myUserId,
          targetRole: member.role,
          viewerIsOwner: isOwner,
        });

        if (!editable) {
          return <Badge variant="secondary">{roleLabels[current]}</Badge>;
        }

        return (
          <RoleSelect
            aria-label={`Role for ${member.user.name}`}
            value={current}
            roles={grantableRoles}
            className="h-8 w-44"
            onChange={(role) => role !== current && onRoleChange({ member, role })}
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
        const removable = canRemoveMember({
          canRemove,
          isSelf: member.userId === myUserId,
          targetRole: member.role,
          viewerIsOwner: isOwner,
          ownerCount,
        });

        if (!removable) {
          return null;
        }

        return (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onRemove(member)}>
            Remove
          </Button>
        );
      },
    },
  ];

  return <DataTable columns={columns} rows={members} getRowId={(member) => member.id} />;
}
