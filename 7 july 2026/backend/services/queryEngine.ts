import pool from "../service/dbConnection";
import { buildStackedChartData, groupProductionSegments, groupSegmentsByBucket } from "../helpers/productionSegments.ts";
import { groupTimelineSegments } from "../helpers/timelineHelper.ts";
import { buildTimelineSummary } from "../helpers/timelineSummary.ts";
import type { ChartQuery } from "../types/chartQuery.ts";
import { getAggregationExpression, getIntervalExpression, getTimeBucketExpression } from "../utils/queryHelper.ts";

export const getChartData = async (query:ChartQuery) => {
  const {deviceId, metric, secondaryMetric, range, aggregation, timeBucket, dailyTimeFilterEnabled, dailyStartTime, dailyEndTime} = query;

  const intervalExpression = getIntervalExpression(range);
  let timeFilterClause = "";
  
  if (dailyTimeFilterEnabled) {
    if(dailyStartTime > dailyEndTime){
    timeFilterClause = `
      AND
      ((recorded_at AT TIME ZONE 'Asia/Kolkata')::time >= '${dailyStartTime}'::time OR (recorded_at AT TIME ZONE 'Asia/Kolkata')::time <= '${dailyEndTime}'::time)
    `;
    }else{
    timeFilterClause = `
      AND
      (recorded_at AT TIME ZONE 'Asia/Kolkata')::time BETWEEN '${dailyStartTime}'::time AND '${dailyEndTime}'::time
    `;
    }

  }

  if (aggregation === "none") {//no aggregation
    if (secondaryMetric === "none") {
      const result = await pool.query(
          `
          SELECT
              recorded_at AS time,
              (payload->>$2)::numeric AS value
          FROM sensor_readings
          WHERE device_id = $1
          AND
          recorded_at >= NOW() - INTERVAL '${intervalExpression}'
          ${timeFilterClause}
          ORDER BY recorded_at ASC
          `,
          [deviceId,metric]
      );
      return result.rows;
    } else {
      const result = await pool.query(
          `
          SELECT
              recorded_at AS time,
              (payload->>$2)::numeric AS value,
              (payload->>$3)::numeric AS secondaryvalue
          FROM sensor_readings
          WHERE device_id = $1
          AND
          recorded_at >= NOW() - INTERVAL '${intervalExpression}'
          ${timeFilterClause}
          ORDER BY recorded_at ASC
          `,
          [deviceId,metric,secondaryMetric]
      );
      return result.rows;
    }
      
  }

  const aggregationExpression = getAggregationExpression(aggregation);

  const timeBucketExpression = getTimeBucketExpression(timeBucket);


  const timeExpression = `date_trunc('${timeBucketExpression}', recorded_at)`;

  const valueExpression = `${aggregationExpression}((payload->>$2)::numeric)`;

  if(secondaryMetric === "none"){
    const result =
      await pool.query(
        `
        SELECT
            ${timeExpression} AS time,
            ${valueExpression} AS value
        FROM sensor_readings
        WHERE device_id = $1
        AND
        recorded_at >= NOW() - INTERVAL '${intervalExpression}'
        ${timeFilterClause}
        GROUP BY time
        ORDER BY time ASC;
        `,
        [deviceId, metric]
      );

    return result.rows;    
  }else{
    const secondaryValueExpression = `${aggregationExpression}((payload->>$3)::numeric)`
    const result =
      await pool.query(
        `
        SELECT
            ${timeExpression} AS time,
            ${valueExpression} AS value,
            ${secondaryValueExpression} As secondaryvalue
        FROM sensor_readings
        WHERE device_id = $1
        AND
        recorded_at >= NOW() - INTERVAL '${intervalExpression}'
        ${timeFilterClause}
        GROUP BY time
        ORDER BY time ASC;
        `,
        [deviceId, metric, secondaryMetric]
      );

    return result.rows;
  }
};

export const getMetricData = async (query:any) => {
  const {deviceId, metric, range, aggregation, dailyTimeFilterEnabled, dailyStartTime, dailyEndTime} = query;
  const intervalExpression = getIntervalExpression(range);
  let timeFilterClause = "";
  
  if (dailyTimeFilterEnabled) {
    if(dailyStartTime > dailyEndTime){
    timeFilterClause = `
      AND
      ((recorded_at AT TIME ZONE 'Asia/Kolkata')::time >= '${dailyStartTime}'::time OR (recorded_at AT TIME ZONE 'Asia/Kolkata')::time <= '${dailyEndTime}'::time)
    `;
    }else{
    timeFilterClause = `
      AND
      (recorded_at AT TIME ZONE 'Asia/Kolkata')::time BETWEEN '${dailyStartTime}'::time AND '${dailyEndTime}'::time
    `;
    }

  }

  const aggregationExpression = getAggregationExpression(aggregation);

  const valueExpression = `${aggregationExpression}((payload->>$2)::numeric)`;

  const result =
    await pool.query(
      `
      SELECT
          ${valueExpression} AS value
      FROM sensor_readings
      WHERE device_id = $1
      AND
      recorded_at >= NOW() - INTERVAL '${intervalExpression}'
      ${timeFilterClause}
      `,
      [deviceId, metric]
    );

  return result.rows[0];    
};

export const getProductionChartData = async (query:any) =>{
    const {
        deviceId,
        range,
        aggregation,
        dailyTimeFilterEnabled,
        dailyStartTime,
        dailyEndTime,
        productType,
        timeBucket
    } = query;

  const intervalExpression = getIntervalExpression(range);
  let timeFilterClause = "";

  let productFilterClause = "";
  if (
      productType &&
      productType !== "all"
  ) {
      productFilterClause = `
          AND payload->>'type' = '${productType}'
      `;
  }  
  
  if (dailyTimeFilterEnabled) {
    if(dailyStartTime > dailyEndTime){
    timeFilterClause = `
      AND
      ((recorded_at AT TIME ZONE 'Asia/Kolkata')::time >= '${dailyStartTime}'::time OR (recorded_at AT TIME ZONE 'Asia/Kolkata')::time <= '${dailyEndTime}'::time)
    `;
    }else{
    timeFilterClause = `
      AND
      (recorded_at AT TIME ZONE 'Asia/Kolkata')::time BETWEEN '${dailyStartTime}'::time AND '${dailyEndTime}'::time
    `;
    }

  }

  const result = await pool.query(`
        SELECT
            recorded_at,
            payload
        FROM sensor_readings
        WHERE
            device_id = $1
            ${productFilterClause}
            AND recorded_at >= NOW() - INTERVAL '${intervalExpression}'
            ${timeFilterClause}
        ORDER BY recorded_at ASC;`, [deviceId]);

  const readings = result.rows.map(row => ({
      timestamp: row.recorded_at,
      type: row.payload.type,
      count: Number(row.payload.count),
  }));


  const segments = groupProductionSegments(readings);
  const buckets = groupSegmentsByBucket(segments, timeBucket);

  return buckets;
}

export const getProductionMetricData = async (query: any) => {

  const {deviceId, range, aggregation, dailyTimeFilterEnabled, dailyStartTime, dailyEndTime, productType} = query;
  const intervalExpression = getIntervalExpression(range);
  let timeFilterClause = "";
  let productFilterClause = "";

  if (
      productType &&
      productType !== "all"
  ) {
      productFilterClause = `
          AND payload->>'type' = '${productType}'
      `;
  }

  if (dailyTimeFilterEnabled) {
    if(dailyStartTime > dailyEndTime){
    timeFilterClause = `
      AND
      ((recorded_at AT TIME ZONE 'Asia/Kolkata')::time >= '${dailyStartTime}'::time OR (recorded_at AT TIME ZONE 'Asia/Kolkata')::time <= '${dailyEndTime}'::time)
    `;
    }else{
    timeFilterClause = `
      AND
      (recorded_at AT TIME ZONE 'Asia/Kolkata')::time BETWEEN '${dailyStartTime}'::time AND '${dailyEndTime}'::time
    `;
    }

  }

  const result =
    await pool.query(
      `
      SELECT
          recorded_at, payload
      FROM sensor_readings
      WHERE device_id = $1
      ${productFilterClause}
      AND
      recorded_at >= NOW() - INTERVAL '${intervalExpression}'
      ${timeFilterClause}
      ORDER BY recorded_at ASC;
      `,
      [deviceId]
    );

  const readings = result.rows.map(row => ({
        timestamp: row.recorded_at,
        type: row.payload.type,
        count: Number(row.payload.count),
    }));

  if (readings.length === 0) {
      return { value: null };
  }

  const total = readings.reduce(
      (sum, reading) => sum + reading.count,
      0
  );

  const minimum = Math.min(
      ...readings.map(reading => reading.count)
  );

  const maximum = Math.max(
      ...readings.map(reading => reading.count)
  );

  switch (aggregation) {
      case "sum":
          return { value: total };

      case "avg":
          return {
              value: total / readings.length,
          };

      case "min":
          return { value: minimum };

      case "max":
          return { value: maximum };

      default:
          return { value: null };
  } 
};


export const getDeviceProductTypes = async (
    deviceId: string
) => {
    const result = await pool.query(
        `
        SELECT DISTINCT payload->>'type' AS type
        FROM sensor_readings
        WHERE device_id = $1
        ORDER BY type;
        `,
        [deviceId]
    );

    return result.rows.map(row => row.type);
};


export const getTimelineChartData = async (query: any) => {
    const {
        deviceId,
        range,
        aggregation,
        dailyTimeFilterEnabled,
        dailyStartTime,
        dailyEndTime,
        productType
    } = query;

  const intervalExpression = getIntervalExpression(range);
  let timeFilterClause = "";

  
  if (dailyTimeFilterEnabled) {
    if(dailyStartTime > dailyEndTime){
    timeFilterClause = `
      AND
      ((recorded_at AT TIME ZONE 'Asia/Kolkata')::time >= '${dailyStartTime}'::time OR (recorded_at AT TIME ZONE 'Asia/Kolkata')::time <= '${dailyEndTime}'::time)
    `;
    }else{
    timeFilterClause = `
      AND
      (recorded_at AT TIME ZONE 'Asia/Kolkata')::time BETWEEN '${dailyStartTime}'::time AND '${dailyEndTime}'::time
    `;
    }

  }

const result = await pool.query(`
    SELECT
        recorded_at,
        payload
    FROM sensor_readings
    WHERE
        device_id = $1
        AND recorded_at >= NOW() - INTERVAL '${intervalExpression}'
        ${timeFilterClause}
    ORDER BY recorded_at ASC;
`, [deviceId]);

  const readings = result.rows.map(row => ({
      timestamp: row.recorded_at,
      type: row.payload.type,
      count: Number(row.payload.count),
      reason: row.payload.reason,
  }));

const segments = groupTimelineSegments(readings);

const summary = buildTimelineSummary(segments);

return {
    segments,
    summary,
};
}


