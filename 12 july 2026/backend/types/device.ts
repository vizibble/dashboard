export interface Device {
  device_id: string;
  user_id: string;
  name: string;
  type: string;
  location: string;
  created_at: Date;
  updated_at: Date;
}

export interface HistoryRow {
  payload: Record<string, number>;
  recorded_at: Date;
}

export interface DeviceOwnerInfo {
  email: string;
  alertEmails?: string[];
  deviceName: string;
}
