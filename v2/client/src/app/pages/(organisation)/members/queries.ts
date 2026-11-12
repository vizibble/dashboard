import { queryOptions } from '@tanstack/react-query';

import { getInvitations, getMembers } from '@/app/pages/(organisation)/members/api';

/** Query definitions for members. Keys: ['members', organisationId, scope]. */
export const memberQueries = {
  all: (organisationId: string) => ['members', organisationId] as const,
  list: (organisationId: string) =>
    queryOptions({
      queryKey: [...memberQueries.all(organisationId), 'list'] as const,
      queryFn: () => getMembers(organisationId),
    }),
  invitations: (organisationId: string) =>
    queryOptions({
      queryKey: [...memberQueries.all(organisationId), 'invitations'] as const,
      queryFn: () => getInvitations(organisationId),
    }),
};
