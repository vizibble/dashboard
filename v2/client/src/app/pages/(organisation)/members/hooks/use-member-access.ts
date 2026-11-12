import { assignableRoles } from '@vizibble/shared/permissions';

import { authClient } from '@/app/pages/(auth)/client';
import { usePermissions } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { hasRole, OWNER } from '@/app/pages/(organisation)/shared/lib/roles';

/** What the signed-in member may do on the members page. */
export function useMemberAccess() {
  const { role, can } = usePermissions();

  const { data: session } = authClient.useSession();

  const isOwner = hasRole(role, OWNER);

  return {
    myRole: role,
    myUserId: session?.user.id,
    isOwner,
    canInvite: can({ invitation: ['create'] }),
    canCancel: can({ invitation: ['cancel'] }),
    canChangeRoles: can({ member: ['update'] }),
    canRemove: can({ member: ['delete'] }),
    // Only owners may grant or edit the owner role; Better Auth enforces the same rule.
    grantableRoles: isOwner ? assignableRoles : assignableRoles.filter((item) => item !== OWNER),
  };
}

export type MemberAccess = ReturnType<typeof useMemberAccess>;
