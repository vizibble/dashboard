import { timeRanges } from '@vizibble/shared/dashboards';
import { useMemo } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { DateTimeField } from '@/app/pages/dashboards/shared/components/date-time-field';
import { isOneOf } from '@/app/pages/dashboards/shared/lib/is-one-of';
import { TIME_RANGE_LABELS } from '@/app/pages/dashboards/shared/lib/labels';
import { dashboardFilterOptions } from '@/app/pages/dashboards/shared/lib/location-scope';
import type { DashboardDetail, DashboardFilters as Filters } from '@/app/pages/dashboards/shared/types';
import { useFetchDevices } from '@/app/pages/devices/shared/hooks/use-device-queries';
import { useFetchLocations } from '@/app/pages/locations/shared/hooks/use-location-queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/ui/select';

const ALL = 'all';

type DashboardFiltersProps = {
  dashboard: DashboardDetail;
  filters: Filters;
  onChange: (filters: Filters) => void;
  timezone: string | undefined;
};

/** Dashboard-wide filters. Every widget that doesn't override them follows these. */
export function DashboardFilters({ dashboard, filters, onChange, timezone }: DashboardFiltersProps) {
  const { organisation } = useOrganisationContext();

  const { data: locations = [] } = useFetchLocations(organisation.id);

  const { data: devices = [] } = useFetchDevices(organisation.id);

  // Locations within the dashboard's location (or all for an organisation dashboard).
  const { locationOptions, deviceOptions } = useMemo(
    () => dashboardFilterOptions(locations, devices, dashboard.location_id, filters.locationId),
    [dashboard.location_id, devices, filters.locationId, locations],
  );

  const showScopeFilters = dashboard.scope !== 'device';

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        value={filters.timeRange}
        onValueChange={(value) => isOneOf(timeRanges, value) && onChange({ ...filters, timeRange: value })}
      >
        <SelectTrigger size="sm" className="w-40" aria-label="Time range">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {timeRanges.map((range) => (
            <SelectItem key={range} value={range}>
              {TIME_RANGE_LABELS[range]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filters.timeRange === 'custom' && (
        <div className="flex flex-wrap items-end gap-2 [&_input]:h-8 [&_label]:sr-only">
          <DateTimeField
            id="filter-from"
            label="From"
            value={filters.timeFrom}
            onChange={(value) => onChange({ ...filters, timeFrom: value })}
          />
          <DateTimeField
            id="filter-to"
            label="To"
            value={filters.timeTo}
            onChange={(value) => onChange({ ...filters, timeTo: value })}
          />
        </div>
      )}

      {showScopeFilters && locationOptions.length > 0 && (
        <Select
          value={filters.locationId ?? ALL}
          onValueChange={(value) =>
            onChange({ ...filters, locationId: value === ALL ? null : value, deviceId: null })
          }
        >
          <SelectTrigger size="sm" className="w-48" aria-label="Location">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All locations</SelectItem>
            {locationOptions.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showScopeFilters && deviceOptions.length > 0 && (
        <Select
          value={filters.deviceId ?? ALL}
          onValueChange={(value) => onChange({ ...filters, deviceId: value === ALL ? null : value })}
        >
          <SelectTrigger size="sm" className="w-44" aria-label="Device">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All devices</SelectItem>
            {deviceOptions.map((device) => (
              <SelectItem key={device.id} value={device.id}>
                {device.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {timezone && (
        <span className="text-muted-foreground pb-1.5 text-xs">Times in {timezone.replaceAll('_', ' ')}</span>
      )}
    </div>
  );
}
