import api from "@/api/axios";

export const getDevices = async () => 
  api.get('/api/sensorData/devices');

export const getDeviceMetrics = async (deviceId: string) => 
  api.get(`/api/sensorData/devices/${deviceId}/metrics`);

export const getDeviceReadings = async (deviceId: string) => 
  api.get(`/api/sensorData/devices/${deviceId}/readings`);

export const getChartData = async (
  deviceId: string,
  metric: string,
  secondaryMetric: string,
  range: string,
  aggregation: string,
  timeBucket: string,
  dailyTimeFilterEnabled: boolean,
  dailyStartTime: string,
  dailyEndTime: string
) =>
  api.get('/api/sensorData/chart-data', {
    params: {
      deviceId,
      metric,
      secondaryMetric,
      range,
      aggregation,
      timeBucket,
      dailyTimeFilterEnabled,
      dailyStartTime,
      dailyEndTime,
    },
  });

export const getMetricData = async (config: any) =>
  api.get('/api/sensorData/getMetricData', {
    params: config,
  });

export const getProductionChartData = async (
  deviceId: string,
  range: string,
  aggregation: string,
  dailyTimeFilterEnabled: boolean,
  dailyStartTime: string,
  dailyEndTime: string,
  productType: string,
  timeBucket: string
) =>
  api.get('/api/sensorData/getProductionChartData', {
    params: {
      deviceId,
      range,
      aggregation,
      dailyTimeFilterEnabled,
      dailyStartTime,
      dailyEndTime,
      productType,
      timeBucket,
    },
  });

export const getProductionMetricData = async (config: any) =>
  api.get('/api/sensorData/getProductionMetricData', {
    params: config,
  });

export const getDeviceProductTypes = async (deviceId: string) =>
  api.get('/api/sensorData/getDeviceProductTypes', {
    params: { deviceId },
  });

export const getTimelineChartData = async (
  deviceId: string,
  range: string,
  dailyTimeFilterEnabled: boolean,
  dailyStartTime: string,
  dailyEndTime: string,
  productType: string
) =>
  api.get('/api/sensorData/getTimelineChartData', {
    params: {
      deviceId,
      range,
      dailyTimeFilterEnabled,
      dailyStartTime,
      dailyEndTime,
      productType,
    },
  });