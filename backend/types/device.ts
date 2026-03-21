export interface Device {
  id: number;
  device_id: string;
  user_id: string;
  device_info: {
    name: string;
    type: string;
    location: string;
  };
  created_at: Date;
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
