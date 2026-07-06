import { Router } from "express";
import pool from "../service/dbConnection.ts"
import { getChartData, getDeviceProductTypes, getMetricData, getProductionChartData, getProductionMetricData, getTimelineChartData } from "../services/queryEngine.ts";
import type { aggregationMethod, ChartRange, timeBucket } from "../types/chartQuery.ts";
import { getDevices } from "../services/deviceService.ts";
import { loadTemplate, saveTemplate } from "../services/templateRepository.ts";
import dotenv from "dotenv"

dotenv.config();
const router = Router();
const DEV_USER_ID = String(process.env.DEV_USER_ID);

router.get("/chart-data", async (req, res) => {
    const {deviceId,metric, secondaryMetric, range, aggregation, timeBucket, dailyTimeFilterEnabled, dailyStartTime, dailyEndTime} = req.query;

    const data =
      await getChartData(
        {
          deviceId: deviceId as string,
          metric: metric as string,
          secondaryMetric: secondaryMetric as string,
          range:range as ChartRange,
          aggregation:aggregation as aggregationMethod,
          timeBucket:timeBucket as timeBucket,
          dailyTimeFilterEnabled: dailyTimeFilterEnabled === "true",
          dailyStartTime:dailyStartTime as string,
          dailyEndTime:dailyEndTime as string,
        }
      );
      
    res.json(data);
})

router.get("/getMetricData", async (req, res) => {
      const {deviceId, metric, range, aggregation, dailyTimeFilterEnabled, dailyStartTime, dailyEndTime} = req.query;

    const data =
      await getMetricData(
        {
          deviceId: deviceId as string,
          metric: metric as string,
          range:range as ChartRange,
          aggregation:aggregation as aggregationMethod,
          dailyTimeFilterEnabled: dailyTimeFilterEnabled === "true",
          dailyStartTime:dailyStartTime as string,
          dailyEndTime:dailyEndTime as string,
        }
      );
    //console.log(data)
    res.json(data);
})

router.get("/devices/:deviceId/readings", async (req, res) => {
  try {
      const { deviceId } =
        req.params;

      const result =
        await pool.query(
          `
          SELECT
            payload,
            recorded_at
          FROM sensor_readings
          WHERE device_id = $1
          ORDER BY recorded_at ASC
          `,
          [deviceId]
        );

      res.json(
        result.rows
      );

    } catch (error) {
      console.error(error);
      res.status(500).json({
        message:
          "Failed to fetch readings"
      });
    }
  }
);

router.get("/devices", async (_, res) => {
    const devices = await getDevices(DEV_USER_ID);
    res.json(devices);
  }
);

router.get("/devices/:deviceId/metrics", async (req, res) => {
    try {
      const { deviceId } = req.params;

      const result =
        await pool.query(
          `
          SELECT payload
          FROM sensor_readings
          WHERE device_id = $1
          LIMIT 1
          `,
          [deviceId]
        );

      if (
        result.rows.length === 0
      ) {
        return res.json([]);
      }

      const payload =
        result.rows[0].payload;

      const metrics = Object.keys(payload).filter((key) =>{
        return !["timestamp", "type", "reason"].includes(key)}
      );
      res.json(metrics);

    } catch (error) {
      console.error(error);
      res.status(500).json({
        message:"Failed to fetch metrics"
      });

    }
  }
);

router.get("/health", async (_, res) => {
    const result =
      await pool.query(
        "SELECT NOW()"
      );
    res.json(result.rows);
  }
);

router.post("/template", async (req, res)=>{
  const template = req.body;
  const userID = DEV_USER_ID;

  await saveTemplate(userID, template);

  res.json({success:true});
})

router.get("/template", async (req, res)=>{
  const userID = DEV_USER_ID;

  const template = await loadTemplate(userID);
  
  res.json(template);
  
})

router.get("/getProductionChartData", async (req, res) => {
    const {deviceId,range, aggregation, dailyTimeFilterEnabled, dailyStartTime, dailyEndTime, productType, timeBucket} = req.query;
    const data =
      await getProductionChartData(
        {
          deviceId: deviceId as string,
          range:range as ChartRange,
          aggregation:aggregation as aggregationMethod,
          dailyTimeFilterEnabled: dailyTimeFilterEnabled === "true",
          dailyStartTime:dailyStartTime as string,
          dailyEndTime:dailyEndTime as string,
          productType:productType as string,
          timeBucket:timeBucket as string,
        }
      );
    res.json(data)
});


router.get("/getProductionMetricData", async (req, res) => {
    const {
        deviceId,
        range,
        aggregation,
        dailyTimeFilterEnabled,
        dailyStartTime,
        dailyEndTime,
        productType,
    } = req.query;

    const data = await getProductionMetricData({
        deviceId: deviceId as string,
        range: range as ChartRange,
        aggregation: aggregation as aggregationMethod,
        dailyTimeFilterEnabled: dailyTimeFilterEnabled === "true",
        dailyStartTime: dailyStartTime as string,
        dailyEndTime: dailyEndTime as string,
        productType: productType as string,
    });

    res.json(data);
});

router.get("/getDeviceProductTypes", async (req, res) => {
    const { deviceId } = req.query;

    const productTypes = await getDeviceProductTypes(
        deviceId as string
    );

    res.json(productTypes);
});

router.get("/getTimelineChartData", async (req, res) => {
    const {
        deviceId,
        range,
        dailyTimeFilterEnabled,
        dailyStartTime,
        dailyEndTime,
        productType,
    } = req.query;

    const data = await getTimelineChartData({
        deviceId: deviceId as string,
        range: range as ChartRange,
        dailyTimeFilterEnabled:
            dailyTimeFilterEnabled === "true",
        dailyStartTime: dailyStartTime as string,
        dailyEndTime: dailyEndTime as string,
        productType: productType as string,
    });

    res.json(data);
});


export default router;