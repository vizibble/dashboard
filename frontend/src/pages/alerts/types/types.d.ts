export interface Alert {
  id: number;
  device_id: string;
  parameter: string;
  formatted_parameter?: string;
  value: string;
  recorded_at: string;
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
  created_at: string;
}

export interface CreateAlertRulePayload {
  device_id: string;
  parameter: string;
  condition: Condition;
  threshold: number;
  label?: string;
}

export interface AddRuleFormData {
  parameter: string;
  condition: Condition;
  threshold: string;
  label: string;
}

export interface AddRuleFormProps {
  selectedDeviceId: string;
  availableParams: string[];
  loadingParams: boolean;
}

export interface CreateAlertRulePayload {
  device_id: string;
  parameter: string;
  condition: Condition;
  threshold: number;
  label?: string;
}
