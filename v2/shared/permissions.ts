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
  telemetry: ["read", "export"],
  dashboard: ["read", "create", "update", "delete"],
  report: ["read", "create", "update", "delete", "export"],
} as const;

export const ac = createAccessControl(statements);

const readOnly = {
  settings: ["read"],
  location: ["read"],
  device: ["read"],
  telemetry: ["read"],
  dashboard: ["read"],
  report: ["read"],
} as const;

const fullResources = {
  location: ["read", "create", "update", "delete"],
  device: ["read", "create", "update", "delete"],
  template: ["read", "create", "update", "delete"],
  telemetry: ["read", "export"],
  dashboard: ["read", "create", "update", "delete"],
  report: ["read", "create", "update", "delete", "export"],
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

export const operator = ac.newRole({
  ...memberAc.statements,
  ...readOnly,
  template: ["read"],
});

export const viewer = ac.newRole({
  ...memberAc.statements,
  ...readOnly,
});

/**
 * Better Auth's default role for members added without an explicit role. Kept so
 * existing `member` rows keep working; it grants exactly what a viewer gets.
 */
export const member = ac.newRole({
  ...memberAc.statements,
  ...readOnly,
});

export const roles = { owner, admin, engineer, operator, viewer, member };

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
  "operator",
  "viewer",
] as const satisfies readonly RoleName[];

export type AssignableRole = (typeof assignableRoles)[number];

export const roleLabels: Record<RoleName, string> = {
  owner: "Owner",
  admin: "Admin",
  engineer: "Engineer",
  operator: "Operator",
  viewer: "Viewer",
  member: "Viewer",
};

export const roleDescriptions: Record<AssignableRole, string> = {
  owner: "Full control, including deleting the organisation.",
  admin: "Manages members, settings and every resource.",
  engineer: "Manages devices, templates, locations, dashboards and reports.",
  operator: "Monitors devices, telemetry and dashboards. Read-only.",
  viewer: "Views dashboards, devices and reports. Read-only.",
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
