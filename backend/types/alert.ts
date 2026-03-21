export interface Alert {
  id: number;
  device_id: string;
  parameter: string;
  value: string;
  recorded_at: Date;
  device_name: string;
  device_location: string;
  device_type: string;
}

export type Condition = 'gt' | 'lt' | 'gte' | 'lte' | 'eq';

export interface AlertRule {
  id: number;
  rule_id: string;
  device_id: string;
  parameter: string;
  condition: Condition;
  threshold: number;
  label: string | null;
  enabled: boolean;
  created_at: Date;
}
