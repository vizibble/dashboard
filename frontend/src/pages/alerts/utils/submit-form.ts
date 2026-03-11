import type { AddRuleFormData, CreateAlertRulePayload } from "@/pages/alerts/types/types";



export const submitRuleForm = async (
  data: AddRuleFormData,
  selectedDeviceId: string,
  createMutationAsync: (variables: CreateAlertRulePayload) => Promise<unknown>,
  reset: () => void
) => {
  try {
    await createMutationAsync({
      device_id: selectedDeviceId,
      parameter: data.parameter.trim(),
      condition: data.condition,
      threshold: Number(data.threshold),
      label: data.label.trim() || undefined,
    });
    reset();
  } catch (error) {
    // Error is handled by the mutation or global error boundary
    console.error("Error creating rule:", error);
  }
};
