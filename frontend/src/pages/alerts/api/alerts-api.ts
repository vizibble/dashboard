import axios from 'axios';

import api from '@/api/axios';
import type {
  Alert,
  AlertRule,
  CreateAlertRulePayload,
} from '@/pages/alerts/types/types';

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    return await api.get<Alert[]>('/api/alert');
  } catch (err: unknown) {
    let message = 'Failed to fetch alerts.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}

export async function fetchDeviceRules(deviceId: string): Promise<AlertRule[]> {
  try {
    return await api.get<AlertRule[]>('/api/alert/rules', { params: { deviceId } });
  } catch (err: unknown) {
    let message = 'Failed to fetch alert rules.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}

export async function createAlertRule(
  payload: CreateAlertRulePayload
): Promise<AlertRule> {
  try {
    return await api.post<AlertRule>('/api/alert/rules', payload);
  } catch (err: unknown) {
    let message = 'Failed to create alert rule.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}

export async function deleteAlertRule(ruleId: string): Promise<void> {
  try {
    await api.delete(`/api/alert/rules/${ruleId}`);
  } catch (err: unknown) {
    let message = 'Failed to delete alert rule.';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || message;
    }
    throw new Error(message);
  }
}
