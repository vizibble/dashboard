import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetchDevices } from '@/hooks/fetch-devices';
import { cn } from '@/lib/utils';

export interface DeviceSelectProps {
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string, type?: string) => void;
  className?: string;
  size?: 'sm' | 'default';
}

export const DeviceSelect = ({
  selectedDevice,
  onSelectDevice,
  className,
  size = 'default',
}: DeviceSelectProps) => {
  const { devices = [], loading } = useFetchDevices();

  if (loading) {
    return <Skeleton className={cn('h-9 w-56 rounded-lg', className)} />;
  }

  if (!devices.length) {
    return (
      <div
        className={cn(
          'flex h-9 items-center rounded-lg border px-3 text-sm text-muted-foreground',
          className
        )}
      >
        No devices available
      </div>
    );
  }

  const selected = devices.find((d) => d.device_id === selectedDevice);

  return (
    <Select
      value={selectedDevice ?? ''}
      onValueChange={(value) => {
        const device = devices.find((d) => d.device_id === value);
        if (device) onSelectDevice(device.device_id, device.type);
      }}
    >
      <SelectTrigger
        className={cn(
          'flex items-center gap-2 bg-white dark:bg-input/30',
          className
        )}
        size={size}
      >
        <SelectValue placeholder="Select device">
          {selected && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="size-2 shrink-0 rounded-full bg-green-400 animate-pulse" />
              <span className="truncate font-medium">{selected.name}</span>
              <Badge
                className="ml-1 h-4 px-1.5 py-0 text-[10px] opacity-70"
                variant="secondary"
              >
                {selected.location}
              </Badge>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent className="max-h-72">
        {devices.map((d) => {
          const active = d.device_id === selectedDevice;
          return (
            <SelectItem
              key={d.device_id}
              className="cursor-pointer"
              value={d.device_id}
            >
              <div className="flex w-full items-center gap-2">
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full bg-slate-300',
                    active && 'bg-green-400 animate-pulse'
                  )}
                />
                <span className="truncate">{d.name}</span>
                <Badge
                  className="ml-auto h-4 px-1.5 py-0 text-[9px] opacity-60"
                  variant="outline"
                >
                  {d.location}
                </Badge>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
