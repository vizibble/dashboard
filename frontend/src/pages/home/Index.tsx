import { Droplets, Gauge, Thermometer } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';
import { useSocket } from '@/hooks/useSocket';
import { Barometer } from '@/pages/home/components/barometer';
import { Chart } from '@/pages/home/components/chart';
import { DevicePicker } from '@/pages/home/components/device-picker';
import { HumidityWidget } from '@/pages/home/components/humidity';
import { MachineStatusChart } from '@/pages/home/components/machine-status-chart';
import { Temp } from '@/pages/home/components/temperature';
import { StatWidget } from '@/pages/home/components/widget';
import { useDeviceHistory } from '@/pages/home/hooks/fetch-device-history';
import { useSensorStore } from '@/pages/home/store/sensor-store';
import {
  getHumidityOptions,
  getPressureOptions,
  getTemperatureOptions,
} from '@/pages/home/utils/chart-options';

import { useMemo } from 'react';
import { getLoomDummyData } from '@/pages/home/components/loom-dummy-data';
import { LoomCumulativeChart } from '@/pages/home/components/loom-cumulative-chart';
import { LoomStats } from '@/pages/home/components/loom-stats';
import { useLoomTimeSeries } from '@/pages/home/hooks/use-loom-time-series';

export const HomePage = () => {
  useSocket();
  const { isLoading: historyLoading } = useDeviceHistory();
  const dummyLoomData = useMemo(() => getLoomDummyData(), []);
  const selectedDeviceId = useSensorStore((s) => s.selectedDeviceId);
  const selectedDeviceType = useSensorStore((s) => s.selectedDeviceType);
  const history = useSensorStore((s) => s.history);

  const isTempHumidity = selectedDeviceType === 'temp_humidity';
  const isDiffPressure = selectedDeviceType === 'diff_pressure';
  const isLengthCount = selectedDeviceType === 'production_count';

  const loomTimes = selectedDeviceId ? history['length']?.times ?? [] : dummyLoomData.times;
  const loomValues = selectedDeviceId ? history['length']?.values ?? [] : dummyLoomData.values;
  const loomMetrics = useLoomTimeSeries(loomTimes, loomValues);

  const temperatureOptions = getTemperatureOptions({
    times: history['temperature']?.times ?? [],
    temperatureData: history['temperature']?.values ?? [],
  });
  const humidityOptions = getHumidityOptions({
    times: history['humidity']?.times ?? [],
    humidityData: history['humidity']?.values ?? [],
  });
  const pressureOptions = getPressureOptions({
    times: history['differential_pressure']?.times ?? [],
    differentialPressureData: history['differential_pressure']?.values ?? [],
    thresholds: { min: -1, max: 5 },
  });

  return (
    <main className="flex flex-col w-full min-h-0">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-sm border-b px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <DevicePicker />
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Loading history */}
        {selectedDeviceId && historyLoading && (
          <div className="flex items-center justify-center gap-2.5 text-sm font-medium text-muted-foreground py-16">
            <Spinner className="size-5 text-primary" />
            <span>Loading data...</span>
          </div>
        )}
        {/* Temp + Humidity */}
        {selectedDeviceId && !historyLoading && isTempHumidity && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
              <StatWidget
                title="Humidity"
                icon={<Droplets className="text-blue-500" size={16} />}
              >
                <HumidityWidget />
              </StatWidget>
              <StatWidget
                title="Temperature"
                icon={<Thermometer className="text-orange-500" size={16} />}
              >
                <Temp />
              </StatWidget>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <Chart title="Humidity" options={humidityOptions} />
              <Chart title="Temperature" options={temperatureOptions} />
            </div>
          </>
        )}
        {/* Differential Pressure */}
        {selectedDeviceId && !historyLoading && isDiffPressure && (
          <>
            <div className="w-full">
              <StatWidget
                title="Differential Pressure"
                icon={<Gauge className="text-green-500" size={16} />}
              >
                <Barometer />
              </StatWidget>
            </div>
            <div className="w-full">
              <Chart title="Differential Pressure" options={pressureOptions} />
            </div>
          </>
        )}
        {/* Fabric Production — Weaving Loom */}
        {selectedDeviceId && !historyLoading && isLengthCount && (
          <>
            {/* Row 1: Stats */}
            <LoomStats summary={loomMetrics.summary} />

            {/* Row 2: Cumulative Area Chart */}
            <LoomCumulativeChart times={loomMetrics.times} values={loomMetrics.cumulativeValues} />

            {/* Row 3: Active / Idle / Offline timeline */}
            <MachineStatusChart 
              statusData={loomMetrics.statusData} 
              summary={loomMetrics.summary} 
            />
          </>
        )}

        {/* Start page demo if nothing selected */}
        {!selectedDeviceId && (
          <>
            <LoomStats summary={loomMetrics.summary} />
            <LoomCumulativeChart times={loomMetrics.times} values={loomMetrics.cumulativeValues} />
            <MachineStatusChart 
              statusData={loomMetrics.statusData} 
              summary={loomMetrics.summary} 
            />
          </>
        )}
      </div>
    </main>
  );
};
