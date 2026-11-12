import { PlusIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

import { InvitationsSection } from '@/app/pages/(organisation)/members/components/invitations-section';
import { InviteMemberDialog } from '@/app/pages/(organisation)/members/components/invite-member-dialog';
import {
  RemoveMemberDialog,
  RoleChangeDialog,
} from '@/app/pages/(organisation)/members/components/member-confirm-dialogs';
import { MembersTable } from '@/app/pages/(organisation)/members/components/members-table';
import { MyAccess } from '@/app/pages/(organisation)/members/components/my-access';
import { useMemberAccess } from '@/app/pages/(organisation)/members/hooks/use-member-access';
import { useMemberActions } from '@/app/pages/(organisation)/members/hooks/use-member-actions';
import {
  useFetchInvitations,
  useFetchMembers,
} from '@/app/pages/(organisation)/members/hooks/use-member-queries';
import { countOwners, filterMembers } from '@/app/pages/(organisation)/members/lib/members';
import { ListView } from '@/app/shared/components/layout/list-view';
import { PageContainer } from '@/app/shared/components/layout/page-container';
import { PageHeader } from '@/app/shared/components/layout/page-header';
import { Button } from '@/app/shared/components/ui/button';

export function MembersPage() {
  const access = useMemberAccess();

  const canManageInvitations = access.canInvite || access.canCancel;

  const { data: members = [], isLoading, isFetching, isError, refetch } = useFetchMembers();

  const { data: invitations = [] } = useFetchInvitations(canManageInvitations);

  const actions = useMemberActions();

  const [search, setSearch] = useState('');

  const visibleMembers = useMemo(() => filterMembers(members, search), [members, search]);

  return (
    <PageContainer>
      <PageHeader
        title="Members"
        description="People in your organisation and what they can do."
        actions={
          access.canInvite && (
            <Button size="sm" onClick={actions.openInvite}>
              <PlusIcon /> Invite member
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <MyAccess role={access.myRole} />

        <ListView
          search={{ value: search, onChange: setSearch, placeholder: 'Search by name, email or role…' }}
          count={{ shown: visibleMembers.length, total: members.length }}
          isRefetching={!isLoading && isFetching}
        >
          <MembersTable
            access={access}
            members={visibleMembers}
            ownerCount={countOwners(members)}
            search={search}
            onClearSearch={() => setSearch('')}
            isLoading={isLoading}
            isError={isError}
            isFetching={isFetching}
            onRetry={() => void refetch()}
            onRoleChange={actions.requestRoleChange}
            onRemove={actions.requestRemove}
          />
        </ListView>

        {canManageInvitations && (
          <InvitationsSection
            access={access}
            invitations={invitations}
            onResend={(invitation) => void actions.resend(invitation)}
            onCancel={(invitation) => void actions.cancel(invitation)}
            isResending={actions.isResending}
            isCancelling={actions.isCancelling}
          />
        )}
      </div>

      <InviteMemberDialog
        open={actions.inviting}
        onClose={actions.closeInvite}
        roles={access.grantableRoles}
      />

      <RoleChangeDialog
        roleChange={actions.roleChange}
        onClose={actions.closeRoleChange}
        onConfirm={() => void actions.confirmRoleChange()}
        isPending={actions.isChangingRole}
      />

      <RemoveMemberDialog
        member={actions.removing}
        onClose={actions.closeRemove}
        onConfirm={() => void actions.confirmRemove()}
        isPending={actions.isRemoving}
      />
    </PageContainer>
  );
}
