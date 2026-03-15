import 'dotenv/config';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';

import alertRouter from '@/routes/alert.js';
import authRouter from '@/routes/auth.js';
import deviceRouter from '@/routes/device.js';
import ruleRouter from '@/routes/rule.js';
import sensorRouter from '@/routes/sensor.js';
import userRouter from '@/routes/user.js';
import { initSocket } from '@/sockets/index.js';

const app = express();

app.use(
  cors({
    origin: process.env['CORS_ORIGIN'],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
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
app.use('/api/rule', ruleRouter);
app.use('/api/user', userRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
);

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = Number(process.env['PORT']);

httpServer.listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}`)
);
