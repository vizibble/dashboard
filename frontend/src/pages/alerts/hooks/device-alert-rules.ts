import {
  createAlertRule, deleteAlertRule, fetchDeviceRules,
} from '@/pages/alerts/api/alert-rules';
import type { CreateAlertRulePayload } from '@/pages/alerts/types/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useFetchDeviceRules = (deviceId: string | null) => {
  const query = useQuery({
    queryKey: ["alert-rules", deviceId],
    queryFn: () => fetchDeviceRules(deviceId!),
    enabled: !!deviceId,
  });
  return {
    rules: query.data ?? [],
    loading: query.isLoading,
  };
};

export const useCreateAlertRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAlertRulePayload) => createAlertRule(payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["alert-rules", variables.device_id],
      });
    },
  });
};

export const useDeleteAlertRule = (deviceId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => deleteAlertRule(ruleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["alert-rules", deviceId],
      });
    },
  });
};
