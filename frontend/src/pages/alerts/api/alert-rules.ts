import api from '@/api/axios';
import type {
  AlertRule,
  CreateAlertRulePayload,
} from '@/pages/alerts/types/types';

export async function fetchDeviceRules(deviceId: string): Promise<AlertRule[]> {
  const res = await api.get<AlertRule[]>('/api/rule', { params: { deviceId } });
  return res.data;
}

export async function createAlertRule(
  payload: CreateAlertRulePayload
): Promise<AlertRule> {
  const res = await api.post<AlertRule>('/api/rule', payload);
  return res.data;
}

export async function deleteAlertRule(ruleId: string): Promise<void> {
  await api.delete('/api/rule', { data: { ruleId } });
}
