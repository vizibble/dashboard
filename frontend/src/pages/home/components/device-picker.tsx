import { DeviceTabs } from '@/components/device-tabs';
import { useSensorStore } from '@/pages/home/store/sensor-store';

export const DevicePicker = () => {
  const selectedDeviceId = useSensorStore((s) => s.selectedDeviceId);
  const setDevice = useSensorStore((s) => s.setDevice);

  return (
    <DeviceTabs
      selectedDevice={selectedDeviceId}
      onSelectDevice={(id, type) => setDevice(id, type || '')}
    />
  );
};
