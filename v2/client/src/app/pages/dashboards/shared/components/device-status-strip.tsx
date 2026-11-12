import { Link } from 'react-router-dom';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useDeviceStatus } from '@/app/pages/dashboards/shared/hooks/use-dashboard-queries';
import { formatRelative } from '@/app/pages/dashboards/shared/lib/format';
import { descendantLocationIds } from '@/app/pages/dashboards/shared/lib/location-scope';
import type { DashboardTarget, DeviceStatus } from '@/app/pages/dashboards/shared/types';
import { useFetchLocations } from '@/app/pages/locations/shared/hooks/use-location-queries';
import { Indicator } from '@/app/shared/components/layout/page-header';

const TONE = { online: 'green', offline: 'red', never: 'gray' } as const;

const LABEL = {
  online: 'Online',
  offline: 'Offline',
  never: 'Never connected',
} as const;

/** Descendant location ids, so a parent location counts devices in its children. */
function useLocationScope(target: DashboardTarget) {
  const { organisation } = useOrganisationContext();

  const { data: locations = [] } = useFetchLocations(organisation.id);

  if (target.scope !== 'location') {
    return null;
  }

  return descendantLocationIds(locations, target.locationId);
}

/**
 * Connectivity comes only from when a device last sent data, never from metric values.
 * Shown above organisation and location dashboards, and as a status line for a device.
 */
export function DeviceStatusStrip({
  target,
  refreshSeconds,
}: {
  target: DashboardTarget;
  refreshSeconds: number;
}) {
  const { organisation } = useOrganisationContext();

  const { data: status, isPending } = useDeviceStatus(organisation.id, refreshSeconds);

  const devices = status?.devices ?? [];

  const offlineAfterSeconds = status?.offline_after_seconds;

  const locationIds = useLocationScope(target);

  if (isPending) {
    return null;
  }

  if (target.scope === 'device') {
    const device = devices.find((item) => item.id === target.deviceId);

    if (!device) {
      return null;
    }

    return (
      <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <Indicator tone={TONE[device.status]}>{LABEL[device.status]}</Indicator>
        Last communication {formatRelative(device.last_seen_at).toLowerCase()}
      </p>
    );
  }

  const scoped = locationIds ? devices.filter((device) => locationIds.has(device.location_id)) : devices;

  const count = (status: DeviceStatus['status']) =>
    scoped.filter((device) => device.status === status).length;

  const offline = scoped.filter((device) => device.status === 'offline');

  return (
    <section
      aria-label="Device connectivity"
      className="bg-card grid grid-cols-2 rounded-lg border sm:grid-cols-4"
    >
      <Stat label="Devices" value={scoped.length} />
      <Stat label="Online" value={count('online')} tone="text-emerald-700 dark:text-emerald-400" />
      <Stat
        label="Offline"
        value={count('offline')}
        tone={count('offline') ? 'text-red-700 dark:text-red-400' : ''}
      />
      <Stat label="Never connected" value={count('never')} />
      {offline.length > 0 && (
        <p className="text-muted-foreground col-span-full border-t px-4 py-2 text-xs">
          Offline (no data for {Math.round((offlineAfterSeconds ?? 600) / 60)}+ min):{' '}
          {offline.slice(0, 6).map((device, index) => (
            <span key={device.id}>
              {index > 0 && ', '}
              <Link to={`/devices/${device.id}`} className="text-foreground hover:underline">
                {device.name}
              </Link>
            </span>
          ))}
          {offline.length > 6 && ` and ${offline.length - 6} more`}
        </p>
      )}
    </section>
  );
}

function Stat({ label, value, tone = '' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="border-r px-4 py-3 last:border-r-0 max-sm:nth-2:border-r-0 max-sm:nth-[-n+2]:border-b">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`text-xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
