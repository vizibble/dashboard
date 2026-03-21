import { Router } from 'express';

import { handleSensorData } from '@/controllers/sensor.js';

const router = Router();

router.post('/', (req, res, next) => {
  handleSensorData(req, res, next).catch(next);
});

export default router;
