import { ArrowSquareOutIcon, PlusIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { useFetchDevices } from '@/app/pages/devices/shared/hooks/use-devices-api';
import { CustomDeviceIcon } from '@/app/shared/components/icons/nav-icons';
import { Button } from '@/app/shared/components/ui/button';
import { Spinner } from '@/app/shared/components/ui/spinner';

interface LocationDevicesSectionProps {
  locationId: string;
}

export function LocationDevicesSection({ locationId }: LocationDevicesSectionProps) {
  const { organisation } = useOrganisationContext();
  const { devices: allDevices, isPending: isLoading, error: fetchError } = useFetchDevices(organisation.id);
  const devices = allDevices.filter((device) => device.location_id === locationId);
  const error = fetchError ? 'Unable to load devices for this location.' : null;

  return (
    <section aria-labelledby="devices-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="devices-heading" className="text-foreground text-sm font-semibold tracking-tight">
          Assigned Devices
        </h2>
        <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 px-3 text-xs">
          <Link to="/devices" aria-label="Go to devices page to assign or manage devices">
            <PlusIcon size={13} weight="bold" aria-hidden="true" />
            <span>Manage in Devices</span>
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="border-border/70 bg-card flex min-h-[160px] items-center justify-center rounded-lg border p-6 shadow-xs">
          <div className="text-muted-foreground flex items-center gap-2.5 text-xs">
            <Spinner className="size-4" />
            <span>Loading devices...</span>
          </div>
        </div>
      ) : error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-xs">
          {error}
        </div>
      ) : devices.length === 0 ? (
        <div className="border-border/70 bg-card rounded-lg border border-dashed p-8 text-center shadow-xs">
          <div className="border-border/60 bg-muted/40 text-muted-foreground mx-auto mb-3 flex size-10 items-center justify-center rounded-lg border">
            <CustomDeviceIcon size={22} weight="duotone" className="text-primary" />
          </div>
          <p className="text-foreground text-sm font-medium">No devices assigned to this terminal space</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs leading-relaxed">
            Attach IoT sensors, controllers, or edge devices to this space to begin collecting telemetry.
          </p>
          <Button size="sm" variant="outline" asChild className="mt-4 h-8 gap-1.5 px-3 text-xs">
            <Link to="/devices">
              <PlusIcon size={14} weight="bold" aria-hidden="true" />
              <span>Assign device</span>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="border-border/70 bg-card divide-border/60 divide-y overflow-hidden rounded-lg border shadow-xs">
          {devices.map((device) => (
            <div
              key={device.id}
              className="hover:bg-muted/40 flex items-center justify-between gap-4 px-4 py-3 transition-colors"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="border-border/60 bg-muted/40 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md border"
                  aria-hidden="true"
                >
                  <CustomDeviceIcon size={18} weight="duotone" className="text-primary" />
                </span>
                <div className="min-w-0">
                  <span className="text-foreground block truncate text-sm font-medium">{device.name}</span>
                  <span className="text-muted-foreground block text-xs">
                    Device ID: <span className="font-mono text-[11px]">{device.id}</span>
                  </span>
                </div>
              </div>

              <Button variant="ghost" size="sm" asChild className="h-8 gap-1 px-2.5 text-xs">
                <Link to={`/devices/${device.id}`} aria-label={`View ${device.name} details`}>
                  <span>Details</span>
                  <ArrowSquareOutIcon size={12} aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
