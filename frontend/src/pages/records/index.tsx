import { useState, useEffect } from 'react';

import { CalendarIcon } from 'lucide-react';

import { DeviceSelect } from '@/components/device-select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Chart } from '@/pages/home/components/chart';
import { LoomCumulativeBarChart } from '@/pages/home/components/loom-cumulative-bar-chart';
import { LoomStats } from '@/pages/home/components/loom-stats';
import { MachineStatusChart } from '@/pages/home/components/machine-status-chart';
import { useLoomTimeSeries } from '@/pages/home/hooks/use-loom-time-series';
import {
  DEFAULT_HUMIDITY_THRESHOLDS,
  DEFAULT_PRESSURE_THRESHOLDS,
  DEFAULT_TEMPERATURE_THRESHOLDS,
  DEFAULT_RPM_THRESHOLDS,
  getHumidityOptions,
  getPressureOptions,
  getTemperatureOptions,
  getRpmOptions,
} from '@/pages/home/utils/chart-options';
import { formatTimeLabel } from '@/pages/home/utils/format-time';
import { useAvailableDates } from '@/pages/records/hooks/use-available-dates';
import { useDeviceRecords } from '@/pages/records/hooks/use-device-records';
import { cn } from '@/utils/cn';
import { useFetchDevices } from '@/hooks/fetch-devices';
import { useSearchParams } from 'react-router-dom';

// Helper to format Date state to YYYY-MM-DD
const formatDateForApi = (date?: Date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const RecordsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { devices } = useFetchDevices();

  // Initialise from query params if present
  const paramDevice = searchParams.get('device');
  const paramDate = searchParams.get('date');

  const [date, setDate] = useState<Date | undefined>(() => {
    if (!paramDate) return undefined;
    // Parse YYYY-MM-DD as local date to avoid timezone offset shifting the day
    const [y, m, d] = paramDate.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    const parsed = new Date(y, m - 1, d);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(
    paramDevice ?? null
  );
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');

  // Once devices load, resolve the type for a device that came from query params
  useEffect(() => {
    if (!selectedDeviceId || selectedDeviceType) return;
    const device = devices.find((d) => d.device_id === selectedDeviceId);
    if (device) setSelectedDeviceType(device.type ?? '');
  }, [devices, selectedDeviceId, selectedDeviceType]);

  // Keep URL in sync with current selections
  const syncParams = (deviceId: string | null, selectedDate: Date | undefined) => {
    const params: Record<string, string> = {};
    if (deviceId) params['device'] = deviceId;
    if (selectedDate) params['date'] = formatDateForApi(selectedDate) ?? '';
    setSearchParams(params, { replace: true });
  };

  const isTempHumidity = selectedDeviceType === 'temp_humidity';
  const isDiffPressure = selectedDeviceType === 'diff_pressure';
  const isLengthCount = selectedDeviceType === 'production_count';
  const isCount = selectedDeviceType === 'count';
  const isLoomStyle = isLengthCount || isCount;

  const { dates: availableDates, isLoading: loadingDates } =
    useAvailableDates(selectedDeviceId);

  const resolution = isLoomStyle ? 'minute' : 'hour';
  const nextDate = date ? new Date(date) : undefined;
  if (nextDate) nextDate.setDate(nextDate.getDate() + 1);

  const { data: data1, isLoading: loadingRecords1 } = useDeviceRecords(
    selectedDeviceId,
    formatDateForApi(date),
    resolution
  );

  const { data: data2, isLoading: loadingRecords2 } = useDeviceRecords(
    selectedDeviceId,
    formatDateForApi(nextDate),
    resolution,
    true
  );

  const isLoading = loadingDates || loadingRecords1 || loadingRecords2;

  // Process data for charts
  const history1 = data1?.rows ?? [];
  const history2 = data2?.rows ?? [];
  const historyRaw = [...history1, ...history2];
  
  const shiftStartHour = 8;
  const shiftStartMinute = isCount ? 30 : 0;
  
  const startTimeObj = date ? new Date(date) : new Date();
  startTimeObj.setHours(shiftStartHour, shiftStartMinute, 0, 0);
  const startTimeMs = startTimeObj.getTime();
  const endTimeMs = startTimeMs + 24 * 3600 * 1000 - 60_000;

  const history = historyRaw.filter((row) => {
    const t = new Date(row.recorded_at).getTime();
    return t >= startTimeMs && t <= endTimeMs;
  });
  const times: string[] = [];
  const temperatureData: number[] = [];
  const humidityData: number[] = [];
  const pressureData: number[] = [];
  const rpmData: number[] = [];

  const loomHistory: Record<string, any> = {};

  history.forEach((row) => {
    const d = new Date(row.recorded_at);
    const label = formatTimeLabel(d, 'daily');
    times.push(label);

    if (row.payload['temperature'] !== undefined) {
      temperatureData.push(row.payload['temperature']);
    }
    if (row.payload['humidity'] !== undefined) {
      humidityData.push(row.payload['humidity']);
    }
    if (row.payload['differential_pressure'] !== undefined) {
      pressureData.push(row.payload['differential_pressure']);
    }
    if (row.payload['rpm'] !== undefined) {
      rpmData.push(row.payload['rpm']);
    }
    
    // Populate loomHistory with all payload fields
    for (const [key, val] of Object.entries(row.payload)) {
      if (!loomHistory[key]) {
        loomHistory[key] = { times: [], values: [], rawTimes: [] };
      }
      loomHistory[key].times.push(row.recorded_at);
      loomHistory[key].values.push(val);
      loomHistory[key].rawTimes.push(row.recorded_at);
    }
  });

  const loomMetrics = useLoomTimeSeries(
    loomHistory,
    date || new Date(),
    isCount
  );

  const temperatureOptions = getTemperatureOptions({
    times,
    temperatureData,
    thresholds: DEFAULT_TEMPERATURE_THRESHOLDS,
  });
  const humidityOptions = getHumidityOptions({
    times,
    humidityData,
    thresholds: DEFAULT_HUMIDITY_THRESHOLDS,
  });
  const pressureOptions = getPressureOptions({
    times,
    differentialPressureData: pressureData,
    thresholds: DEFAULT_PRESSURE_THRESHOLDS,
  });
  const rpmOptions = getRpmOptions({
    times: isLoomStyle 
      ? loomMetrics.times.map(t => new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })) 
      : times,
    rpmData: isLoomStyle ? (loomMetrics.rpmValues as number[]) : rpmData,
  });

  return (
    <main className="flex flex-col w-full min-h-0 bg-slate-50 min-h-screen">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-sm border-b px-4 sm:px-6 py-3">
        <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:block font-bold uppercase tracking-widest text-muted-foreground shrink-0">
              Device
            </span>
            <Separator className="hidden sm:block h-4" orientation="vertical" />
            <DeviceSelect
              onSelectDevice={(id, type) => {
                setSelectedDeviceId(id);
                setSelectedDeviceType(type || '');
                // Reset date when the device changes
                setDate(undefined);
                syncParams(id, undefined);
              }}
              selectedDevice={selectedDeviceId}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground shrink-0 hidden sm:block">
              Date
            </span>
            <div className="h-4 w-[1px] bg-border hidden sm:block" />
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                  variant={'outline'}
                  disabled={!selectedDeviceId || loadingDates}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    date.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  disabled={(date) => {
                    const formattedDate = formatDateForApi(date);
                    return (
                      !formattedDate || !availableDates.includes(formattedDate)
                    );
                  }}
                  selected={date}
                  mode="single"
                  autoFocus
                  onSelect={(d) => {
                    setDate(d);
                    setCalendarOpen(false);
                    syncParams(selectedDeviceId, d);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 md:p-6 space-y-6">
        {!selectedDeviceId && (
          <div className="py-24 text-center text-muted-foreground">
            Please select a device to view records.
          </div>
        )}

        {selectedDeviceId && !date && (
          <div className="py-24 text-center text-muted-foreground">
            Please pick a date to view records.
          </div>
        )}

        {selectedDeviceId && date && isLoading && (
          <div className="flex items-center justify-center gap-2.5 text-sm font-medium text-muted-foreground py-16">
            <Spinner className="size-5 text-primary" />
            <span>Loading records...</span>
          </div>
        )}

        {selectedDeviceId && date && !isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              {isTempHumidity && (
                <>
                  <Chart
                    key={`hum-${date.toISOString()}`}
                    title="Humidity"
                    options={humidityOptions}
                  />
                  <Chart
                    key={`temp-${date.toISOString()}`}
                    title="Temperature"
                    options={temperatureOptions}
                  />
                </>
              )}
              {isDiffPressure && (
                <div className="col-span-full">
                  <Chart
                    key={`press-${date.toISOString()}`}
                    title="Differential Pressure"
                    options={pressureOptions}
                  />
                </div>
              )}
            </div>
            {isLoomStyle && (
              <>
                <LoomStats isHistory={true} summary={loomMetrics.summary} unit={isCount ? 'pcs' : 'kg'} />
                <MachineStatusChart
                  key={`loomstat-${date.toISOString()}`}
                  statusData={loomMetrics.statusData}
                  summary={loomMetrics.summary}
                  targetDate={date}
                  isCount={isCount}
                />
                <LoomCumulativeBarChart
                  key={`loomcum-${date.toISOString()}`}
                  times={loomMetrics.times}
                  targetDate={date}
                  values={loomMetrics.cumulativeValues}
                  products={loomMetrics.products}
                  isCount={isCount}
                />
                <Chart
                  key={`rpm-${date.toISOString()}`}
                  title="RPM"
                  options={rpmOptions}
                  hideStats
                />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
};
