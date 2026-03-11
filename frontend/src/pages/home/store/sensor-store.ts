import { create } from 'zustand';

import type {
  FieldHistory,
  SensorStore,
  SensorValues,
} from '@/pages/home/types/types';

const MAX_HISTORY = 200; // keep the last N points
export const useSensorStore = create<SensorStore>((set) => ({
  selectedDeviceId: null,
  selectedDeviceType: null,
  sensorValues: {},
  history: {},
  lastTimestamp: null,

  setDevice: (id, type) =>
    set({
      selectedDeviceId: id,
      selectedDeviceType: type,
      sensorValues: {},
      history: {},
      lastTimestamp: null,
    }),

  loadHistory: (points) =>
    set(() => {
      const history: Record<string, FieldHistory> = {};
      for (const { payload, recorded_at } of points) {
        const label = new Date(recorded_at).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        for (const [field, val] of Object.entries(payload)) {
          if (typeof val !== 'number') continue;
          if (!history[field]) history[field] = { times: [], values: [] };
          history[field]!.times.push(label);
          history[field]!.values.push(val);
        }
      }
      const lastPoint = points.at(-1);
      const latestValues: SensorValues = lastPoint
        ? { ...lastPoint.payload }
        : {};
      return {
        history,
        sensorValues: latestValues,
        lastTimestamp: lastPoint?.recorded_at ?? null,
      };
    }),

  applyUpdate: (payload) =>
    set((state) => {
      const incoming: SensorValues = {};
      const label =
        typeof payload['timestamp'] === 'string'
          ? new Date(payload['timestamp']).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });

      const nextHistory = { ...state.history };
      for (const [key, val] of Object.entries(payload)) {
        if (key === 'connectionID' || key === 'timestamp') continue;
        if (typeof val !== 'number') continue;
        incoming[key] = val;
        const prev = nextHistory[key] ?? { times: [], values: [] };
        nextHistory[key] = {
          times: [...prev.times, label].slice(-MAX_HISTORY),
          values: [...prev.values, val].slice(-MAX_HISTORY),
        };
      }
      return {
        sensorValues: { ...state.sensorValues, ...incoming },
        history: nextHistory,
        lastTimestamp:
          typeof payload['timestamp'] === 'string'
            ? payload['timestamp']
            : state.lastTimestamp,
      };
    }),

  clearDevice: () =>
    set({
      selectedDeviceId: null,
      selectedDeviceType: null,
      sensorValues: {},
      history: {},
      lastTimestamp: null,
    }),
}));
