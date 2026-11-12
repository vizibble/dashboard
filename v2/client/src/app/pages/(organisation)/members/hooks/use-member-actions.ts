import { roleLabels, type AssignableRole } from '@vizibble/shared/permissions';
import { useState } from 'react';

import {
  useCancelInvitation,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
} from '@/app/pages/(organisation)/members/hooks/use-member-mutations';
import type { Invitation, Member } from '@/app/pages/(organisation)/members/types';
import { primaryRole } from '@/app/pages/(organisation)/shared/lib/roles';
import { toast } from '@/app/shared/hooks/use-toast';
import { getErrorMessage } from '@/app/shared/utils/error-message';

export type RoleChange = { member: Member; role: AssignableRole };

/** Dialog state and confirm workflows for member and invitation actions. */
export function useMemberActions() {
  const updateRole = useUpdateMemberRole();

  const removeMember = useRemoveMember();

  const cancelInvitation = useCancelInvitation();

  const resendInvitation = useInviteMember();

  const [inviting, setInviting] = useState(false);

  const [removing, setRemoving] = useState<Member | null>(null);

  const [roleChange, setRoleChange] = useState<RoleChange | null>(null);

  const confirmRoleChange = async () => {
    if (!roleChange) {
      return;
    }
    try {
      await updateRole.mutateAsync({
        memberId: roleChange.member.id,
        role: roleChange.role,
      });
      toast({
        variant: 'success',
        title: 'Role updated',
        description: `${roleChange.member.user.name} is now ${roleLabels[roleChange.role].toLowerCase()}.`,
      });
      setRoleChange(null);
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to change role',
        description: getErrorMessage(cause),
      });
    }
  };

  const confirmRemove = async () => {
    if (!removing) {
      return;
    }
    try {
      await removeMember.mutateAsync(removing.id);
      toast({
        variant: 'success',
        title: 'Member removed',
        description: `${removing.user.name} no longer has access.`,
      });
      setRemoving(null);
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to remove member',
        description: getErrorMessage(cause),
      });
    }
  };

  const resend = async (invitation: Invitation) => {
    try {
      await resendInvitation.mutateAsync({
        email: invitation.email,
        role: primaryRole(invitation.role ?? 'member'),
        resend: true,
      });
      toast({
        variant: 'success',
        title: 'Invitation resent',
        description: `We emailed ${invitation.email} again.`,
      });
    } catch (cause: unknown) {
      toast({
        variant: 'destructive',
        title: 'Unable to resend invitation',
        description: getErrorMessage(cause),
      });
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
      toast({
        variant: 'destructive',
        title: 'Unable to cancel invitation',
        description: getErrorMessage(cause),
      });
    }
  };

  return {
    inviting,
    openInvite: () => setInviting(true),
    closeInvite: () => setInviting(false),
    roleChange,
    requestRoleChange: setRoleChange,
    closeRoleChange: () => setRoleChange(null),
    confirmRoleChange,
    isChangingRole: updateRole.isPending,
    removing,
    requestRemove: setRemoving,
    closeRemove: () => setRemoving(null),
    confirmRemove,
    isRemoving: removeMember.isPending,
    resend,
    isResending: resendInvitation.isPending,
    cancel,
    isCancelling: cancelInvitation.isPending,
  };
}
