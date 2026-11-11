import type { Permissions } from '@vizibble/shared/permissions';

import { authClient } from '@/app/pages/(auth)/client';
import { useOrganisationContext } from '@/app/pages/(organisation)/context';

/**
 * Whether the current member's role grants a set of permissions. Uses Better Auth's
 * static `checkRolePermission` against the shared role definitions, so it only drives
 * what the UI shows. The API enforces the same rules on every request.
 */
export function roleCan(role: string, permissions: Permissions): boolean {
  return role
    .split(',')
    .some((name) => authClient.organization.checkRolePermission({ role: name.trim() as never, permissions }));
}

export function usePermission(permissions: Permissions): boolean {
  const { role } = useOrganisationContext();
  return roleCan(role, permissions);
}

/** A bound checker for components that need several decisions. */
export function usePermissions() {
  const { role } = useOrganisationContext();
  return { role, can: (permissions: Permissions) => roleCan(role, permissions) };
}
