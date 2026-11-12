import type { Permissions } from '@vizibble/shared/permissions';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import { usePermission } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { ErrorState } from '@/app/shared/components/states/error-state';

/** Renders children only when the member holds the permissions. */
export function Can({
  permissions,
  children,
  fallback = null,
}: {
  permissions: Permissions;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return usePermission(permissions) ? children : fallback;
}

/** Route guard. The API still rejects the underlying requests on its own. */
export function RequirePermission({ permissions }: { permissions: Permissions }) {
  const allowed = usePermission(permissions);

  if (!allowed) {
    return (
      <ErrorState
        title="You don't have access to this page"
        message="Ask an owner or admin of your organisation if you need access."
        variant="inline"
        className="m-6"
      />
    );
  }

  return <Outlet />;
}
