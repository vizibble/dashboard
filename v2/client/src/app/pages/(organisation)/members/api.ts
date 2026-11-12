import type { AssignableRole } from '@vizibble/shared/permissions';

import { authClient, unwrap } from '@/app/pages/(auth)/client';

export type InviteMemberInput = { email: string; role: AssignableRole; resend?: boolean };
export type UpdateMemberRoleInput = { memberId: string; role: AssignableRole };

export function getMembers(organizationId: string) {
  return unwrap(
    authClient.organization.listMembers({ query: { organizationId, limit: 1000 } }),
    'Unable to load members.',
  );
}

export function getInvitations(organizationId: string) {
  return unwrap(
    authClient.organization.listInvitations({ query: { organizationId } }),
    'Unable to load invitations.',
  );
}

export function inviteMember(organizationId: string, input: InviteMemberInput) {
  return unwrap(
    authClient.organization.inviteMember({
      email: input.email,
      role: input.role,
      resend: input.resend,
      organizationId,
    }),
    'Unable to send the invitation.',
  );
}

export function cancelInvitation(invitationId: string) {
  return unwrap(
    authClient.organization.cancelInvitation({ invitationId }),
    'Unable to cancel the invitation.',
  );
}

export function updateMemberRole(organizationId: string, input: UpdateMemberRoleInput) {
  return unwrap(
    authClient.organization.updateMemberRole({ memberId: input.memberId, role: input.role, organizationId }),
    'Unable to change the role.',
  );
}

export function removeMember(organizationId: string, memberId: string) {
  return unwrap(
    authClient.organization.removeMember({ memberIdOrEmail: memberId, organizationId }),
    'Unable to remove the member.',
  );
}
