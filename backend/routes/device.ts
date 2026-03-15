import { Router } from 'express';

import {
  handleGetDeviceHistory,
  handleGetDeviceParams,
  handleGetDevices,
  handleGetDeviceRecords,
  handleGetAvailableDates,
} from '@/controllers/device.js';
import { requireAuth } from '@/middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (req, res, next) => {
  handleGetDevices(req, res).catch(next);
});

router.get('/history', requireAuth, (req, res, next) => {
  handleGetDeviceHistory(req, res).catch(next);
});

router.get('/params', requireAuth, (req, res, next) => {
  handleGetDeviceParams(req, res).catch(next);
});

router.get('/records', requireAuth, (req, res, next) => {
  handleGetDeviceRecords(req, res).catch(next);
});

router.get('/records/dates', requireAuth, (req, res, next) => {
  handleGetAvailableDates(req, res).catch(next);
});

export default router;
