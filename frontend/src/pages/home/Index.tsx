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
  DEFAULT_HUMIDITY_THRESHOLDS,
  DEFAULT_PRESSURE_THRESHOLDS,
  DEFAULT_TEMPERATURE_THRESHOLDS,
  getHumidityOptions,
  getPressureOptions,
  getTemperatureOptions,
} from '@/pages/home/utils/chart-options';

import { LoomCumulativeChart } from '@/pages/home/components/loom-cumulative-chart';
import { LoomCumulativeBarChart } from '@/pages/home/components/loom-cumulative-bar-chart';
import { LoomStats } from '@/pages/home/components/loom-stats';
import { useLoomTimeSeries } from '@/pages/home/hooks/use-loom-time-series';

export const HomePage = () => {
  useSocket();
  const { isLoading: historyLoading } = useDeviceHistory();
  const selectedDeviceId = useSensorStore((s) => s.selectedDeviceId);
  const selectedDeviceType = useSensorStore((s) => s.selectedDeviceType);
  const history = useSensorStore((s) => s.history);

  const isTempHumidity = selectedDeviceType === 'temp_humidity';
  const isDiffPressure = selectedDeviceType === 'diff_pressure';
  const isLengthCount = selectedDeviceType === 'production_count';
  const isCount = selectedDeviceType === 'count';

  const loomMetrics = useLoomTimeSeries(history, undefined, isCount);

  const temperatureOptions = getTemperatureOptions({
    times: history['temperature']?.times ?? [],
    temperatureData: (history['temperature']?.values as number[]) ?? [],
    thresholds: DEFAULT_TEMPERATURE_THRESHOLDS,
  });
  const humidityOptions = getHumidityOptions({
    times: history['humidity']?.times ?? [],
    humidityData: (history['humidity']?.values as number[]) ?? [],
    thresholds: DEFAULT_HUMIDITY_THRESHOLDS,
  });
  const pressureOptions = getPressureOptions({
    times: history['differential_pressure']?.times ?? [],
    differentialPressureData: (history['differential_pressure']?.values as number[]) ?? [],
    thresholds: DEFAULT_PRESSURE_THRESHOLDS,
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
                title="Humidity (Daily Avg)"
                icon={<Droplets className="text-blue-500" size={16} />}
              >
                <HumidityWidget />
              </StatWidget>
              <StatWidget
                title="Temperature (Daily Avg)"
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
                title="Differential Pressure (Daily Avg)"
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
        {selectedDeviceId && !historyLoading && (isLengthCount || isCount) && (
          <>
            {/* Stats */}
            <LoomStats summary={loomMetrics.summary} unit={isCount ? 'pcs' : 'm'} />
            {/* Active / Idle / Offline timeline */}
            <MachineStatusChart
              statusData={loomMetrics.statusData}
              summary={loomMetrics.summary}
              isCount={isCount}
            />
            {/* Cumulative Chart */}
            {isLengthCount ? (
              <LoomCumulativeChart
                times={loomMetrics.times}
                values={loomMetrics.cumulativeValues}
              />
            ) : (
              <LoomCumulativeBarChart
                times={loomMetrics.times}
                values={loomMetrics.cumulativeValues}
                products={loomMetrics.products}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
};
