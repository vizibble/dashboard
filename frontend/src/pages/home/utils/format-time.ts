import type { SensorStore } from "@/pages/home/types/types";

const formatters: Record<string, Intl.DateTimeFormat> = {
  instant: new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }),
  daily: new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }),
  monthly: new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }),
};

export const formatTimeLabel = (date: Date, mode: SensorStore['mode']) => {
  return formatters[mode]?.format(date) ?? date.toLocaleString();
};