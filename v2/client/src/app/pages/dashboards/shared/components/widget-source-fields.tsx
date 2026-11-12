import { useMemo } from 'react';

import { useOrganisationContext } from '@/app/pages/(organisation)/context';
import { CheckboxField } from '@/app/pages/dashboards/shared/components/checkbox-field';
import type { WidgetEditor } from '@/app/pages/dashboards/shared/hooks/use-widget-editor';
import { isOneOf } from '@/app/pages/dashboards/shared/lib/is-one-of';
import { toLocationOptions } from '@/app/pages/dashboards/shared/lib/location-scope';
import { SOURCE_MODES } from '@/app/pages/dashboards/shared/lib/widget-input';
import type { DashboardDetail } from '@/app/pages/dashboards/shared/types';
import { useFetchDevices } from '@/app/pages/devices/shared/hooks/use-device-queries';
import { useFetchLocations } from '@/app/pages/locations/shared/hooks/use-location-queries';
import { Field, FieldLabel } from '@/app/shared/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/ui/select';

type WidgetSourceFieldsProps = {
  dashboard: DashboardDetail;
  editor: WidgetEditor;
};

/** Which devices the widget reads: the dashboard's, chosen devices, or one location. */
export function WidgetSourceFields({ dashboard, editor }: WidgetSourceFieldsProps) {
  const { sourceMode, sources, set, chooseSourceMode } = editor;

  const { organisation } = useOrganisationContext();

  const { data: devices = [] } = useFetchDevices(organisation.id);

  const { data: locations = [] } = useFetchLocations(organisation.id);

  const scopeDevices = useMemo(() => {
    if (dashboard.device_id) {
      return devices.filter((device) => device.id === dashboard.device_id);
    }

    return devices;
  }, [dashboard.device_id, devices]);

  const locationOptions = useMemo(
    () => toLocationOptions(locations, new Map(locations.map((location) => [location.id, location]))),
    [locations],
  );

  const toggleDevice = (deviceId: string, checked: boolean) => {
    if (checked) {
      set(
        'sources',
        sources.filter((source) => source.device_id !== deviceId),
      );

      return;
    }
    set('sources', [...sources, { device_id: deviceId }]);
  };

  return (
    <>
      {dashboard.scope !== 'device' && (
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="widget-source">Devices</FieldLabel>
          <Select
            value={sourceMode}
            onValueChange={(value) => isOneOf(SOURCE_MODES, value) && chooseSourceMode(value)}
          >
            <SelectTrigger id="widget-source" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">
                {dashboard.scope === 'location' ? 'All devices at this location' : 'All devices'} (follows
                dashboard filters)
              </SelectItem>
              <SelectItem value="devices">Choose devices</SelectItem>
              <SelectItem value="location">Choose a location</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}

      {sourceMode === 'devices' && (
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium">Select devices</legend>
          <div className="grid max-h-40 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
            {scopeDevices.map((device) => {
              const checked = sources.some((source) => source.device_id === device.id);

              return (
                <CheckboxField
                  key={device.id}
                  id={`widget-device-${device.id}`}
                  checked={checked}
                  onCheckedChange={() => toggleDevice(device.id, checked)}
                >
                  {device.name}
                </CheckboxField>
              );
            })}
          </div>
        </fieldset>
      )}

      {sourceMode === 'location' && (
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="widget-location">Location (includes everything inside it)</FieldLabel>
          <Select
            value={sources[0]?.location_id ?? ''}
            onValueChange={(value) => set('sources', [{ location_id: value, include_child_locations: true }])}
          >
            <SelectTrigger id="widget-location" className="w-full">
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    </>
  );
}
