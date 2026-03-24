// @ts-expect-error Library Error
import ThermometerComponent from 'react-thermometer-component';

import { useDailyAverage } from '@/pages/home/hooks/latest-sensor-value';

export const Temp = () => {
  const value = useDailyAverage('temperature') ?? 0;
  return (
    <ThermometerComponent
      value={value}
      max="50"
      steps="1"
      theme="light"
      size="normal"
      format="°C"
    />
  );
};
