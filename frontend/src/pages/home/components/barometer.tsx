import { useEffect, useRef } from 'react';

import { RadialGauge } from 'canvas-gauges';

import { useSensorField } from '@/pages/home/hooks/latest-sensor-value';

export const Barometer = () => {
  const value = useSensorField('differential_pressure') ?? 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gaugeRef = useRef<RadialGauge | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    gaugeRef.current = new RadialGauge({
      renderTo: canvasRef.current,
      width: 220,
      height: 220,

      units: 'Pa',
      title: '',

      minValue: -10,
      maxValue: 10,

      // Ticks and numbers
      majorTicks: ['-10', '-5', '0', '5', '10'],
      minorTicks: 2,
      strokeTicks: true,

      colorPlate: '#ffffff',
      colorMajorTicks: '#444',
      colorMinorTicks: '#666',
      colorNumbers: '#444',
      colorUnits: '#666',

      // Ranges: Orange then Red
      highlights: [
        { from: 5, to: 8, color: '#ff9800' }, // Orange
        { from: 8, to: 10, color: '#f44336' }, // Red
      ],

      // Borders
      borders: true,
      borderInnerWidth: 0,
      borderMiddleWidth: 0,
      borderOuterWidth: 10,
      colorBorderOuter: '#ccc',
      colorBorderOuterEnd: '#ccc',

      // Value Display
      valueBox: true,
      valueInt: 1,
      valueDec: 1,
      colorValueText: '#444',
      colorValueBoxBackground: 'transparent',
      colorValueBoxRect: 'transparent',
      colorValueBoxRectEnd: 'transparent',
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
