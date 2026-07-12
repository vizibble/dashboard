import type { Condition } from '@/types/alert.js';

export interface AlertRuleRow {
  parameter: string;
  condition: Condition | string;
  threshold: number;
  actualValue: string;
  label?: string | null;
}

export interface EmailJobData {
  to: string;
  deviceName: string;
  firedAt: string; // ISO string – JSON serializable
  rules: AlertRuleRow[];
}

export interface AlertMailOptions {
  to: string;
  deviceName: string;
  firedAt: Date;
  rules: AlertRuleRow[];
}
