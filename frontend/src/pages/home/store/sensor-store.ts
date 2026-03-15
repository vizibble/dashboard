import { create } from 'zustand';

import type {
  FieldHistory,
  SensorStore,
  SensorValues,
} from '@/pages/home/types/types';

export const useSensorStore = create<SensorStore>((set) => ({
  selectedDeviceId: null,
  selectedDeviceType: null,
  sensorValues: {},
  history: {},
  lastTimestamp: null,
  mode: 'instant',

  setMode: (mode) => set({ mode }),

  setDevice: (id, type) =>
    set({
      selectedDeviceId: id,
      selectedDeviceType: type,
      sensorValues: {},
      history: {},
      lastTimestamp: null,
    }),

  loadHistory: ({ rows, mode }) =>
    set(() => {
      const history: Record<string, FieldHistory> = {};

      for (const { payload, recorded_at } of rows) {
        let label = '';
        const date = new Date(recorded_at);

        if (mode === 'instant') {
          label = date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          });
        } else if (mode === 'daily') {
          label = date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
          });
        } else if (mode === 'monthly') {
          label = date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          });
        }

        for (const [field, val] of Object.entries(payload)) {
          if (typeof val !== 'number') continue;
          if (!history[field]) history[field] = { times: [], values: [] };
          history[field]!.times.push(label);
          history[field]!.values.push(val);
        }
      }
      const lastPoint = rows.at(-1);
      const latestValues: SensorValues = lastPoint
        ? { ...lastPoint.payload }
        : {};
      return {
        history,
        mode,
        sensorValues: latestValues,
        lastTimestamp: lastPoint?.recorded_at ?? null,
      };
    }),

  applyUpdate: (payload) =>
    set((state) => {
      // Do not update gauges or history if not in instant mode
      if (state.mode !== 'instant') {
        return state;
      }

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
          times: [...prev.times, label],
          values: [...prev.values, val],
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
      mode: 'instant',
    }),
}));
