import { roleLabels, statements, type Permissions } from '@vizibble/shared/permissions';

import { hasRole, OWNER, primaryRole } from '@/app/pages/(organisation)/shared/lib/roles';

type Resource = keyof typeof statements;

type SearchableMember = { role: string; user: { name: string; email: string } };
type InvitationLike = { status: string; expiresAt: Date | string };

const RESOURCE_LABELS: [Resource, string][] = [
  ['organization', 'Organisation'],
  ['member', 'Members'],
  ['invitation', 'Invitations'],
  ['settings', 'Settings'],
  ['location', 'Locations'],
  ['device', 'Devices'],
  ['template', 'Templates'],
  ['telemetry', 'Telemetry'],
  ['dashboard', 'Dashboards'],
];

export type AccessRow = {
  resource: Resource;
  label: string;
  actions: string[];
};

/** Each labelled resource with the actions the checker allows; resources with none are dropped. */
export function getAccessRows(can: (permissions: Permissions) => boolean): AccessRow[] {
  const rows: AccessRow[] = [];

  for (const [resource, label] of RESOURCE_LABELS) {
    const actions = statements[resource].filter((action) => can({ [resource]: [action] }));

    if (actions.length === 0) {
      continue;
    }
    rows.push({ resource, label, actions });
  }

  return rows;
}

export function isPendingInvitation(invitation: InvitationLike, now = new Date()): boolean {
  if (invitation.status !== 'pending') {
    return false;
  }

  return new Date(invitation.expiresAt) > now;
}

export function filterMembers<T extends SearchableMember>(members: T[], search: string): T[] {
  const query = search.trim().toLowerCase();

  if (!query) {
    return members;
  }

  return members.filter(
    (member) =>
      member.user.name.toLowerCase().includes(query) ||
      member.user.email.toLowerCase().includes(query) ||
      roleLabels[primaryRole(member.role)].toLowerCase().includes(query),
  );
}

export function countOwners(members: { role: string }[]): number {
  return members.filter((member) => hasRole(member.role, OWNER)).length;
}

type TargetRules = {
  isSelf: boolean;
  targetRole: string;
  viewerIsOwner: boolean;
};

/**
 * Self-changes go through ownership transfer (another owner) only; Better Auth
 * also blocks non-owners from touching owners and demoting the last owner.
 */
export function canEditMemberRole({
  canChangeRoles,
  isSelf,
  targetRole,
  viewerIsOwner,
}: TargetRules & { canChangeRoles: boolean }) {
  if (!canChangeRoles || isSelf) {
    return false;
  }

  return viewerIsOwner || !hasRole(targetRole, OWNER);
}

export function canRemoveMember({
  canRemove,
  isSelf,
  targetRole,
  viewerIsOwner,
  ownerCount,
}: TargetRules & { canRemove: boolean; ownerCount: number }) {
  if (!canRemove || isSelf) {
    return false;
  }
  if (!hasRole(targetRole, OWNER)) {
    return true;
  }
  if (ownerCount <= 1) {
    return false;
  }

  return viewerIsOwner;
}

export function canResendInvitation({
  canInvite,
  invitationRole,
  viewerIsOwner,
}: {
  canInvite: boolean;
  invitationRole: string;
  viewerIsOwner: boolean;
}) {
  if (!canInvite) {
    return false;
  }

  return viewerIsOwner || primaryRole(invitationRole) !== OWNER;
}
