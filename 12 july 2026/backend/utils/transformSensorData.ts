
export const transformSensorData = (
  readings: any[],
  metric: string
) => {

  return readings.map(
    (reading) => ({
      time: new Date(
        reading.recorded_at
      ).toLocaleTimeString(),

      value:
        reading.payload[
          metric
        ]
    })
  );

};