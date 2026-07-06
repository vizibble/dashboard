const API_BASE_URL =
  "http://localhost:8080/api/sensorData";

const getJson = async (
  url: string
) => {
  const response =
    await fetch(url);

  return response.json();
};

export const getDevices = async () => getJson(`${API_BASE_URL}/devices`)

export const getDeviceMetrics =
  async (
    deviceId: string
  ) => getJson(`${API_BASE_URL}/devices/${deviceId}/metrics`);

export const getDeviceReadings =
  async (
    deviceId: string
  ) => getJson(`${API_BASE_URL}/devices/${deviceId}/readings`);

export const getChartData =
  async (
    deviceId: string,
    metric: string,
    secondaryMetric: string,
    range:string,
    aggregation:string,
    timeBucket:string,
    dailyTimeFilterEnabled:boolean,
    dailyStartTime:string,
    dailyEndTime:string,
  ) => getJson(`${API_BASE_URL}/chart-data?deviceId=${deviceId}&metric=${metric}&secondaryMetric=${secondaryMetric}&range=${range}&aggregation=${aggregation}&timeBucket=${timeBucket}&dailyTimeFilterEnabled=${dailyTimeFilterEnabled}&dailyStartTime=${dailyStartTime}&dailyEndTime=${dailyEndTime}`);

export const getMetricData = async (config: any) => getJson(`${API_BASE_URL}/getMetricData?deviceId=${config.deviceId}&metric=${config.metric}&range=${config.range}&aggregation=${config.aggregation}&dailyTimeFilterEnabled=${config.dailyTimeFilterEnabled}&dailyStartTime=${config.dailyStartTime}&dailyEndTime=${config.dailyEndTime}`);

export const getProductionChartData = async (
    deviceId: string,
    range: string,
    aggregation: string,
    dailyTimeFilterEnabled: boolean,
    dailyStartTime: string,
    dailyEndTime: string,
    productType: string,
    timeBucket: string
) => {
  const result = await getJson(`${API_BASE_URL}/getProductionChartData?deviceId=${deviceId}&range=${range}&aggregation=${aggregation}&dailyTimeFilterEnabled=${dailyTimeFilterEnabled}&dailyStartTime=${dailyStartTime}&dailyEndTime=${dailyEndTime}&productType=${productType}&timeBucket=${timeBucket}`);

  return result;
};

export const getProductionMetricData = async (config: any) => {
return getJson(`${API_BASE_URL}/getProductionMetricData?deviceId=${config.deviceId}&range=${config.range}&aggregation=${config.aggregation}&dailyTimeFilterEnabled=${config.dailyTimeFilterEnabled}&dailyStartTime=${config.dailyStartTime}&dailyEndTime=${config.dailyEndTime}&productType=${config.productType}`);
};

export const getDeviceProductTypes = async (
    deviceId: string
) => {
    return getJson(
        `${API_BASE_URL}/getDeviceProductTypes?deviceId=${deviceId}`
    );
};

export const getTimelineChartData = async (
    deviceId: string,
    range: string,
    dailyTimeFilterEnabled: boolean,
    dailyStartTime: string,
    dailyEndTime: string,
    productType: string
) => {
    return getJson(
        `${API_BASE_URL}/getTimelineChartData?deviceId=${deviceId}&range=${range}&dailyTimeFilterEnabled=${dailyTimeFilterEnabled}&dailyStartTime=${dailyStartTime}&dailyEndTime=${dailyEndTime}&productType=${productType}`
    );
};