export interface Device {
  device_id: string;
  user_id: string;
  name: string;
  type: string;
  location: string;
  created_at: string;
}

export interface SensorValues {
  [field: string]: number | string;
}
export interface FieldHistory {
  times: string[];
  values: (number | string)[];
  rawTimes: string[];
}

export interface SensorStore {
  selectedDeviceId: string | null;
  selectedDeviceType: string | null;
  sensorValues: SensorValues;
  history: Record<string, FieldHistory>;
  lastTimestamp: string | null;
  mode: string;

  setMode: (mode: string) => void;
  setDevice: (id: string, type: string) => void;
  applyUpdate: (payload: Record<string, number | string>) => void;
  loadHistory: (data: {
    rows: Array<{ payload: Record<string, number | string>; recorded_at: string }>;
    mode: string;
  }) => void;
  clearDevice: () => void;
}
