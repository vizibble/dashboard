import { useQuery } from '@tanstack/react-query';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { isPendingInvitation } from '@/app/pages/(organisation)/members/lib/members';
import { memberQueries } from '@/app/pages/(organisation)/members/queries';

export function useFetchMembers() {
  const { organisation } = useOrganisationContext();

  return useQuery({ ...memberQueries.list(organisation.id), select: (data) => data.members });
}

/** Pending, unexpired invitations. Only fetched for members allowed to manage them. */
export function useFetchInvitations(enabled: boolean) {
  const { organisation } = useOrganisationContext();

  return useQuery({
    ...memberQueries.invitations(organisation.id),
    enabled,
    select: (invitations) => invitations.filter((invitation) => isPendingInvitation(invitation)),
  });
}
