import type { Permissions } from '@vizibble/shared/permissions';

import { authClient } from '@/app/pages/(auth)/client';
import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { isRoleName, parseRoles } from '@/app/pages/(organisation)/shared/lib/roles';

/**
 * Whether the current member's role grants a set of permissions. Uses Better Auth's
 * static `checkRolePermission` against the shared role definitions, so it only drives
 * what the UI shows. The API enforces the same rules on every request.
 */
export function roleCan(role: string, permissions: Permissions): boolean {
  return parseRoles(role)
    .filter(isRoleName)
    .some((name) => authClient.organization.checkRolePermission({ role: name, permissions }));
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
