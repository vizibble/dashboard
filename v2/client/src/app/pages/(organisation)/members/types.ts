import type { getInvitations, getMembers } from '@/app/pages/(organisation)/members/api';

export type Member = Awaited<ReturnType<typeof getMembers>>['members'][number];
export type Invitation = Awaited<ReturnType<typeof getInvitations>>[number];
