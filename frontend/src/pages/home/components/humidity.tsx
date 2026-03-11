import { useEffect, useRef } from 'react';

import { RadialGauge } from 'canvas-gauges';

import { useSensorField } from '@/pages/home/hooks/latest-sensor-value';

export const HumidityWidget = () => {
  const value = useSensorField('humidity') ?? 0;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gaugeRef = useRef<RadialGauge | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    gaugeRef.current = new RadialGauge({
      renderTo: canvasRef.current,
      width: 220,
      height: 220,

      units: '%RH',
      title: 'Humidity',

      minValue: 0,
      maxValue: 100,

      // Clean ticks
      majorTicks: [
        '0',
        '10',
        '20',
        '30',
        '40',
        '50',
        '60',
        '70',
        '80',
        '90',
        '100',
      ],
      minorTicks: 4,

      // Subtle humidity zones
      highlights: [
        { from: 0, to: 30, color: 'rgba(59, 130, 246, 0.15)' },
        { from: 30, to: 70, color: 'rgba(16, 185, 129, 0.15)' },
        { from: 70, to: 100, color: 'rgba(239, 68, 68, 0.15)' },
      ],

      borderShadowWidth: 0,
      borders: false,
    }).draw();

    return () => {
      if (gaugeRef.current) {
        gaugeRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (gaugeRef.current) {
      gaugeRef.current.value = value;
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
      <canvas ref={canvasRef} />
    </div>
  );
};
