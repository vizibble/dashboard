import { DeviceSelect } from '@/components/device-select';
import { Separator } from '@/components/ui/separator';
import { useSensorStore } from '@/pages/home/store/sensor-store';

export const DevicePicker = () => {
  const selectedDeviceId = useSensorStore((s) => s.selectedDeviceId);
  const setDevice = useSensorStore((s) => s.setDevice);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs hidden sm:block font-bold uppercase tracking-widest text-muted-foreground shrink-0">
        Device
      </span>
      <Separator className="hidden sm:block" orientation="vertical" />
      <DeviceSelect
        onSelectDevice={(id, type) => setDevice(id, type || '')}
        selectedDevice={selectedDeviceId}
      />
    </div>
  );
};
