import 'dotenv/config';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';

import alertRouter from '@/routes/alert.js';
import authRouter from '@/routes/auth.js';
import deviceRouter from '@/routes/device.js';
import sensorRouter from '@/routes/sensor.js';
import userRouter from '@/routes/user.js';
import { initSocket } from '@/sockets/index.js';
// import { spawnEmailWorker, shutdownEmailWorker } from '@/service/bullMQQueue.js';
import { globalErrorHandler } from '@/middleware/errorHandler.js';

import sensorRoutes from "./routes/sensorRoutes.ts";
import emailRouter from "./routes/report.ts";

const app = express();

app.use(
  cors({
    origin: process.env['CORS_ORIGIN'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/device', deviceRouter);
app.use('/api/sensor', sensorRouter);
app.use('/api/alert', alertRouter);
app.use('/api/user', userRouter);

app.use("/api", sensorRoutes);
app.use(emailRouter);

app.use(globalErrorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);
// spawnEmailWorker();

const PORT = Number(process.env['PORT']);

httpServer.listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}`)
);

const handleShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}.`);
  // await shutdownEmailWorker();
  httpServer.close(() => {
    console.log('Server closed. Exiting.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
