import type { Template } from "../types/template";
import api from "@/api/axios";

// const API_BASE_URL =
//   "http://localhost:8080/api/sensorData";

export const getTemplate = async (): Promise<Template | null> => {
  try {
    // Note: api base is already configured in the Axios instance
    return await api.get<Template>('/api/sensorData/template');
  } catch (error) {
    return null;
  }
};
export const saveTemplate = async (template: Template): Promise<void> => {
  await api.post('/api/sensorData/template', template);
};