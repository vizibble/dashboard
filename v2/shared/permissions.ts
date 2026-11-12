import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * The single permission model for Vizibble, shared by the Better Auth server plugin,
 * the Better Auth client plugin, the API guards and the UI.
 *
 * `organization`, `member`, `invitation`, `team` and `ac` are Better Auth's own
 * resources: its organisation endpoints (invite, update role, remove member, delete
 * organisation…) check exactly these names, so they are reused unchanged.
 *   - invite a member  → invitation: create
 *   - remove a member  → member: delete
 *   - change a role    → member: update
 * Reading the organisation and its member list only requires membership.
 */
export const statements = {
  ...defaultStatements,
  settings: ["read", "update"],
  location: ["read", "create", "update", "delete"],
  device: ["read", "create", "update", "delete"],
  template: ["read", "create", "update", "delete"],
  telemetry: ["read"],
  dashboard: ["read", "create", "update", "delete"],
} as const;

export const ac = createAccessControl(statements);

/**
 * Roles are sized for a small manufacturing unit (MSME), where one or two people run
 * the plant and a few more watch it:
 *   owner    – proprietor / director. Everything, including deleting the organisation.
 *   admin    – plant manager. Runs the team and settings alongside the owner.
 *   engineer – technician or maintenance engineer. Sets up machines, sensors and dashboards.
 *   member   – shown as "Viewer": supervisor or floor staff. Watches dashboards and readings,
 *              changes nothing. It is Better Auth's default role (the schema default for
 *              member.role), so anyone added without an explicit role is safely read-only.
 */

const readOnly = {
  settings: ["read"],
  location: ["read"],
  device: ["read"],
  template: ["read"],
  telemetry: ["read"],
  dashboard: ["read"],
} as const;

const fullResources = {
  location: ["read", "create", "update", "delete"],
  device: ["read", "create", "update", "delete"],
  template: ["read", "create", "update", "delete"],
  telemetry: ["read"],
  dashboard: ["read", "create", "update", "delete"],
} as const;

export const owner = ac.newRole({
  ...ownerAc.statements,
  ...fullResources,
  settings: ["read", "update"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  ...fullResources,
  settings: ["read", "update"],
});

export const engineer = ac.newRole({
  ...memberAc.statements,
  ...fullResources,
  settings: ["read"],
});

export const member = ac.newRole({
  ...memberAc.statements,
  ...readOnly,
});

export const roles = { owner, admin, engineer, member };

export type RoleName = keyof typeof roles;
export type Statements = typeof statements;
export type Permissions = {
  [R in keyof Statements]?: Statements[R][number][];
};

/** Roles that can be chosen when inviting or changing a member, highest first. */
export const assignableRoles = [
  "owner",
  "admin",
  "engineer",
  "member",
] as const satisfies readonly RoleName[];

export type AssignableRole = (typeof assignableRoles)[number];

export const roleLabels: Record<RoleName, string> = {
  owner: "Owner",
  admin: "Admin",
  engineer: "Engineer",
  member: "Viewer",
};

export const roleDescriptions: Record<AssignableRole, string> = {
  owner: "Full control, including deleting the organisation.",
  admin: "Manages the team, settings and everything in the plant.",
  engineer: "Sets up machines, sensors, templates and dashboards.",
  member: "Watches dashboards and live readings. Can't change anything.",
};

/**
 * Synchronous check against the static role definitions. Better Auth stores
 * multiple roles as a comma-separated string; any matching role grants access.
 * Server code uses this only after membership has been re-read from the database.
 */
export function roleHasPermission(
  role: string | null | undefined,
  permissions: Permissions,
): boolean {
  if (!role) return false;
  return role.split(",").some((name) => {
    const definition = roles[name.trim() as RoleName];
    return definition?.authorize(permissions).success ?? false;
  });
}
