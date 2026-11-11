import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AssignableRole } from '@vizibble/shared/permissions';

import { authClient } from '@/app/pages/(auth)/client';
import { useOrganisationContext } from '@/app/pages/(organisation)/context';

type Result<T> = { data: T | null; error: { message?: string } | null };

/** Better Auth returns `{ data, error }`; react-query expects a throw on failure. */
async function unwrap<T>(request: Promise<Result<T>>, fallback: string): Promise<T> {
  const { data, error } = await request;
  if (error || data === null) throw new Error(error?.message || fallback);
  return data;
}

const membersKey = (organizationId: string) => ['organisation', organizationId, 'members'] as const;
const invitationsKey = (organizationId: string) => ['organisation', organizationId, 'invitations'] as const;

export function useFetchMembers() {
  const { organisation } = useOrganisationContext();
  const query = useQuery({
    queryKey: membersKey(organisation.id),
    queryFn: () =>
      unwrap(
        authClient.organization.listMembers({ query: { organizationId: organisation.id, limit: 1000 } }),
        'Unable to load members.',
      ),
  });
  return { ...query, members: query.data?.members ?? [] };
}

export function useFetchInvitations(enabled: boolean) {
  const { organisation } = useOrganisationContext();
  const query = useQuery({
    queryKey: invitationsKey(organisation.id),
    enabled,
    queryFn: () =>
      unwrap(
        authClient.organization.listInvitations({ query: { organizationId: organisation.id } }),
        'Unable to load invitations.',
      ),
  });
  const invitations = (query.data ?? []).filter(
    (invitation) => invitation.status === 'pending' && new Date(invitation.expiresAt) > new Date(),
  );
  return { ...query, invitations };
}

/** Membership changes can alter the signed-in member's own role, so refresh it too. */
function useMemberMutation<TInput>(run: (organizationId: string, input: TInput) => Promise<unknown>) {
  const { organisation, refreshRole } = useOrganisationContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => run(organisation.id, input),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: membersKey(organisation.id) }),
        queryClient.invalidateQueries({ queryKey: invitationsKey(organisation.id) }),
        refreshRole(),
      ]);
    },
  });
}

export function useInviteMember() {
  return useMemberMutation((organizationId, input: { email: string; role: AssignableRole; resend?: boolean }) =>
    unwrap(authClient.organization.inviteMember({ ...input, organizationId }), 'Unable to send the invitation.'),
  );
}

export function useCancelInvitation() {
  return useMemberMutation((_organizationId, invitationId: string) =>
    unwrap(authClient.organization.cancelInvitation({ invitationId }), 'Unable to cancel the invitation.'),
  );
}

export function useUpdateMemberRole() {
  return useMemberMutation((organizationId, input: { memberId: string; role: AssignableRole }) =>
    unwrap(authClient.organization.updateMemberRole({ ...input, organizationId }), 'Unable to change the role.'),
  );
}

export function useRemoveMember() {
  return useMemberMutation((organizationId, memberId: string) =>
    unwrap(
      authClient.organization.removeMember({ memberIdOrEmail: memberId, organizationId }),
      'Unable to remove the member.',
    ),
  );
}
