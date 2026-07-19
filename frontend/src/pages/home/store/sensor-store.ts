import { create } from 'zustand';

import type {
  FieldHistory,
  SensorStore,
  SensorValues,
} from '@/pages/home/types/types';
import { formatTimeLabel } from '../utils/format-time';

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
        const date = new Date(recorded_at);
        const label = formatTimeLabel(date, mode);

        for (const [field, val] of Object.entries(payload)) {
          if (typeof val !== 'number' && typeof val !== 'string') continue;
          if (!history[field]) history[field] = { times: [], values: [], rawTimes: [] };
          history[field]!.times.push(label);
          history[field]!.values.push(val);
          history[field]!.rawTimes.push(recorded_at);
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
      const date =
        typeof payload['timestamp'] === 'string'
          ? new Date(payload['timestamp'])
          : new Date();
      const label = formatTimeLabel(date, state.mode);

      const nextHistory = { ...state.history };

      for (const [key, val] of Object.entries(payload)) {
        if (key === 'connectionID' || key === 'timestamp') continue;
        if (typeof val !== 'number') continue;
        incoming[key] = val;

        const prev = nextHistory[key] ?? { times: [], values: [], rawTimes: [] };
        nextHistory[key] = {
          times: [...prev.times, label],
          values: [...prev.values, val],
          rawTimes: [...prev.rawTimes, payload['timestamp'] as string],
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
