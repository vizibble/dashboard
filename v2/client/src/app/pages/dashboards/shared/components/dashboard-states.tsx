import { PlusIcon, SquaresFourIcon } from '@phosphor-icons/react';

import { EmptyState } from '@/app/shared/components/states/empty-state';
import { ErrorState } from '@/app/shared/components/states/error-state';
import { Button } from '@/app/shared/components/ui/button';
import { Skeleton } from '@/app/shared/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-flow-row-dense auto-rows-[9.5rem] grid-cols-12 gap-3">
        <Skeleton className="col-span-12 row-span-2 rounded-lg sm:col-span-6 lg:col-span-4" />
        <Skeleton className="col-span-12 row-span-2 rounded-lg sm:col-span-6 lg:col-span-4" />
        <Skeleton className="col-span-12 row-span-2 rounded-lg sm:col-span-6 lg:col-span-4" />
      </div>
    </div>
  );
}

export function DashboardsError() {
  return (
    <div className="bg-card flex min-h-60 items-center justify-center rounded-lg border p-8">
      <ErrorState
        title="Dashboards unavailable"
        message="We couldn't load your dashboards. Please verify your connection."
        variant="inline"
      />
    </div>
  );
}

export function NoDashboards({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return (
    <div className="bg-card rounded-lg border">
      <EmptyState
        icon={SquaresFourIcon}
        title="No dashboards yet"
        description={
          canCreate
            ? "Create a dashboard and add charts, values and maps from your devices' data."
            : 'No dashboards have been shared with you yet.'
        }
        action={
          canCreate ? (
            <Button size="sm" onClick={onCreate}>
              <PlusIcon aria-hidden="true" />
              Create dashboard
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

export function EmptyDashboard({ canEdit, onAddWidget }: { canEdit: boolean; onAddWidget: () => void }) {
  return (
    <div className="bg-card rounded-lg border">
      <EmptyState
        icon={SquaresFourIcon}
        title="This dashboard is empty"
        description={canEdit ? 'Add a widget to start showing data.' : 'Nothing has been added yet.'}
        action={
          canEdit ? (
            <Button size="sm" onClick={onAddWidget}>
              <PlusIcon aria-hidden="true" />
              Add widget
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
