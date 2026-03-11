import { Router } from 'express';

import { handleGetUserAlerts } from '@/controllers/alert.js';
import { requireAuth } from '@/middleware/auth.js';

const router = Router();

router.get("/", requireAuth, handleGetUserAlerts);

export default router;
