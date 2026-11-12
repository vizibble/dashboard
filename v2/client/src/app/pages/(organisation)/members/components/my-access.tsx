import { UsersThreeIcon } from '@phosphor-icons/react';
import { roleLabels } from '@vizibble/shared/permissions';

import { getAccessRows } from '@/app/pages/(organisation)/members/lib/members';
import { usePermissions } from '@/app/pages/(organisation)/shared/hooks/use-permission';
import { primaryRole } from '@/app/pages/(organisation)/shared/lib/roles';
import { Badge } from '@/app/shared/components/ui/badge';

/** The signed-in member's role and what it allows, derived from the shared definitions. */
export function MyAccess({ role }: { role: string }) {
  const { can } = usePermissions();

  const rows = getAccessRows(can);

  return (
    <section aria-labelledby="my-access" className="bg-card rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <UsersThreeIcon aria-hidden="true" className="text-muted-foreground size-5" />
        <h2 id="my-access" className="text-sm font-semibold">
          Your access
        </h2>
        <Badge>{roleLabels[primaryRole(role)]}</Badge>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {rows.map(({ resource, label, actions }) => (
          <div key={resource} className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">{label}</dt>
            <dd>{actions.join(', ')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
