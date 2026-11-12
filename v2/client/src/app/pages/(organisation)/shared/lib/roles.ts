import { assignableRoles, roles, type AssignableRole, type RoleName } from '@vizibble/shared/permissions';

export const OWNER = 'owner' satisfies RoleName;

/** Better Auth stores multiple roles as a comma-separated string. */
export function parseRoles(role: string): string[] {
  return role.split(',').map((item) => item.trim());
}

export function isRoleName(name: string): name is RoleName {
  return name in roles;
}

export function isAssignableRole(name: string): name is AssignableRole {
  return assignableRoles.some((item) => item === name);
}

export function hasRole(role: string, name: RoleName): boolean {
  return parseRoles(role).includes(name);
}

/** The first assignable role in a (possibly comma-separated) Better Auth role string. */
export function primaryRole(role: string): AssignableRole {
  const names = parseRoles(role);

  return assignableRoles.find((item) => names.includes(item)) ?? 'member';
}
