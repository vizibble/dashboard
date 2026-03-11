// @ts-expect-error Library Error
import ThermometerComponent from 'react-thermometer-component';

import { useSensorField } from '@/pages/home/hooks/latest-sensor-value';

export const Temp = () => {
  const value = useSensorField("temperature") ?? 0;
  return (
    <ThermometerComponent
      theme="light"
      value={value}
      max="50"
      steps="1"
      format="°C"
      size="normal"
    />
  );
};
