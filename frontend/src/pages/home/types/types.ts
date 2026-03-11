export interface Device {
  id: number;
  device_id: string;
  user_id: string;
  name: string;
  type: string;
  location: string;
  created_at: string;
}

export interface SensorValues {
  [field: string]: number;
}
export interface FieldHistory {
  times: string[];
  values: number[];
}
export interface SensorStore {
  selectedDeviceId: string | null;
  selectedDeviceType: string | null;
  sensorValues: SensorValues;
  history: Record<string, FieldHistory>;
  lastTimestamp: string | null;

  setDevice: (id: string, type: string) => void;
  applyUpdate: (payload: Record<string, number | string>) => void;
  loadHistory: (
    points: Array<{ payload: Record<string, number>; recorded_at: string }>
  ) => void;
  clearDevice: () => void;
}
