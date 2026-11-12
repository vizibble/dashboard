import type { Device, UpdateDeviceInput } from '@/app/pages/devices/shared/types';

type DeviceFormValues = Pick<Device, 'name' | 'template_id' | 'location_id'>;

/** Only the fields that differ from the saved device; empty when nothing changed. */
export function getDeviceChanges(device: Device, values: DeviceFormValues): UpdateDeviceInput {
  const changes: UpdateDeviceInput = {};

  const name = values.name.trim();

  if (name !== device.name) {
    changes.name = name;
  }
  if (values.template_id !== device.template_id) {
    changes.template_id = values.template_id;
  }
  if (values.location_id !== device.location_id) {
    changes.location_id = values.location_id;
  }

  return changes;
}
