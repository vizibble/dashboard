import { Droplets, Gauge, Thermometer } from 'lucide-react';

import { Loader } from '@/components/loader';
import { useSocket } from '@/hooks/useSocket';
import { Barometer } from '@/pages/home/components/barometer';
import { Chart } from '@/pages/home/components/chart';
import { DevicePicker } from '@/pages/home/components/device-picker';
import { HumidityWidget } from '@/pages/home/components/humidity';
import { Temp } from '@/pages/home/components/temperature';
import { StatWidget } from '@/pages/home/components/widget';
import { useDeviceHistory } from '@/pages/home/hooks/fetch-device-history';
import { useSensorStore } from '@/pages/home/store/sensor-store';
import {
  getHumidityOptions,
  getPressureOptions,
  getTemperatureOptions,
} from '@/pages/home/utils/chart-options';

export const HomePage = () => {
  useSocket();
  const { isLoading: historyLoading } = useDeviceHistory();

  const selectedDeviceId = useSensorStore((s) => s.selectedDeviceId);
  const selectedDeviceType = useSensorStore((s) => s.selectedDeviceType);
  const history = useSensorStore((s) => s.history);

  const isTempHumidity = selectedDeviceType === 'temp_humidity';
  const isDiffPressure = selectedDeviceType === 'diff_pressure';

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
  });

  return (
    <main className="flex-1 flex flex-col w-full min-h-0">
      <div className="sticky top-20 z-30 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <span className="text-xs hidden sm:block font-bold uppercase tracking-widest text-slate-400 shrink-0">
            Device
          </span>
          <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />
          <DevicePicker />
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Loading history */}
        {selectedDeviceId && historyLoading && (
          <Loader
            text="Loading 24-hour history…"
            className="flex items-center justify-center gap-2.5 text-sm font-medium text-slate-400 py-16"
          />
        )}

        {/* Temp + Humidity */}
        {selectedDeviceId && !historyLoading && isTempHumidity && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
              <StatWidget
                title="Humidity"
                icon={<Droplets size={16} className="text-blue-500" />}
              >
                <HumidityWidget />
              </StatWidget>
              <StatWidget
                title="Temperature"
                icon={<Thermometer size={16} className="text-orange-500" />}
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
                icon={<Gauge size={16} className="text-green-500" />}
              >
                <Barometer />
              </StatWidget>
            </div>
            <div className="w-full">
              <Chart title="Differential Pressure" options={pressureOptions} />
            </div>
          </>
        )}
      </div>
    </main>
  );
};
