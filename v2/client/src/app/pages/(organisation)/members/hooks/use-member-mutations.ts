import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import {
  cancelInvitation,
  inviteMember,
  removeMember,
  updateMemberRole,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
} from '@/app/pages/(organisation)/members/api';
import { memberQueries } from '@/app/pages/(organisation)/members/queries';

/** Membership changes can alter the signed-in member's own role, so refresh it too. */
function useMemberMutation<TInput>(run: (organizationId: string, input: TInput) => Promise<unknown>) {
  const { organisation, refreshRole } = useOrganisationContext();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TInput) => run(organisation.id, input),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: memberQueries.all(organisation.id) }),
        refreshRole(),
      ]);
    },
  });
}

export function useInviteMember() {
  return useMemberMutation((organizationId, input: InviteMemberInput) => inviteMember(organizationId, input));
}

export function useCancelInvitation() {
  return useMemberMutation((_organizationId, invitationId: string) => cancelInvitation(invitationId));
}

export function useUpdateMemberRole() {
  return useMemberMutation((organizationId, input: UpdateMemberRoleInput) =>
    updateMemberRole(organizationId, input),
  );
}

export function useRemoveMember() {
  return useMemberMutation((organizationId, memberId: string) => removeMember(organizationId, memberId));
}
